import { combineReducers } from 'redux';
import counter from './counter';
import world from './world';

const rootReducer = combineReducers({
  counter,
  world
});

export default rootReducer;
