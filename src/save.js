import load from './load';

const unpersistedQueue = {};
let isUpdating = {};

export default (db, reducerName) => {
  const loadReducer = load(db);

  const saveReducer = reducerState => {
    if (isUpdating[reducerName]) {
      //enqueue promise
      unpersistedQueue[reducerName] = unpersistedQueue[reducerName] || [];
      unpersistedQueue[reducerName].push(reducerState);

      return Promise.resolve();
    }

    isUpdating[reducerName] = true;

    return loadReducer(reducerName).then(doc => {
      const newDoc = {
        ...doc
      };

      if (Array.isArray(reducerState)) {
        newDoc.state = [
          ...(doc.state || []),
          ...reducerState
        ];
      } else {
        newDoc.state = {
          ...doc.state,
          ...reducerState
        };
      }

      return newDoc;
    }).then(newDoc => {
      return db.put(newDoc);
    }).then(() => {
      isUpdating[reducerName] = false;
      if (unpersistedQueue[reducerName]) {
        const next = unpersistedQueue[reducerName].shift();

        return saveReducer(next);
      }
    }).catch(console.error.bind(console));
  };

  return saveReducer;
};
