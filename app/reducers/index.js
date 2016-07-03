import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import world from './world';
import time from './time';

const rootReducer = combineReducers({
  world,
  time,
  routing
});

export default rootReducer;
