
const chatReducer = (state = null, action) => {
  if (action.type == 'chat/guideIdUpdate') {
    return {...state, guideId: action.data};
  } else {
    return state;
  }
};

export default chatReducer;
