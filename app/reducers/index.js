import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import time from './time';

const rootReducer = combineReducers({
  time,
  routing
});

export default rootReducer;
