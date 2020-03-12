import {createStore} from 'redux';

const profileReducer = (state, action) => {
  const {type, data} = action;
  if (type == 'Initialize') {
    return data;
  } else if (type == 'Update') {
    return data;
  } else {
    return state;
  }
};

const store = createStore(profileReducer);

export default store;
