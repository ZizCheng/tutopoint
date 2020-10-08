import {createStore} from 'redux';

const profileReducer = (state, action) => {
  console.log("profileReducer called with state, action: ");
  console.log(state);
  console.log(action);
  const {type, data} = action;
  if (type == 'Initialize') {
    return data;
  } else if (type == 'Update') {
    state = data;
    return data;
  } else if (type == 'Update Balance') {
     state.stripe.balance = data.balance;
    return state;
  } else if (type == 'Update Transactions') {
    state.transactions = data.transactions;
    return state;
  } else if (type == 'Close Tutorial') {
    state.tutorialHidden = true;
    return state;
  } else {
    return state;
  }
};

const store = createStore(profileReducer);

export default store;
