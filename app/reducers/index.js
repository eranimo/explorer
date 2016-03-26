import { combineReducers } from 'redux';
import world from './world';
import time from './time';

const rootReducer = combineReducers({
  world,
  time
});

export default rootReducer;
