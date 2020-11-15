import { combineReducers, createStore } from 'redux'

import profileReducer from "./profileReducer.js";
import chatReducer from "./chatReducer.js";

const rootReducer = combineReducers({
  profileState: profileReducer,
  chatState: chatReducer
});
const store = createStore(rootReducer);

export default store;
