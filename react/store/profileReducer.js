
const profileReducer = (state = null, action) => {
  const {type, data} = action;
  if (type == 'Initialize') {
    return data;
  } else if (type == 'Update') {
    return data;
  } else if (type == 'Update Balance') {
    //use spread syntax to copy each level
    return {
      ...state,
      stripe: {
        ...state.stripe,
        balance: data.balance
      }
    }
  } else if (type == 'Update Transactions') {
    return {...state, transactions: data.transactions}
  } else if (type == 'Close Tutorial') {
    return {...state, tutorialHidden: true}
  } else {
    return state;
  }
};

export default profileReducer;
