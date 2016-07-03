import { LOAD_WORLD_DATA, SELECT_DAY, REFRESH_START, REFRESH_END } from '../actions/world'

const INITIAL_STATE = {
  isLoaded: false,
  data: {}
};


export default function world(state = INITIAL_STATE, action) {
  switch (action.type) {
    case LOAD_WORLD_DATA:
      console.log('%cLoaded world data: %O', 'font-weight: bold; font-size: 16px', action.payload);
      return { ...state, isLoaded: true, ...action.payload };
    case REFRESH_START:
      return { ...state, isLoaded: false }
    case REFRESH_END:
      console.log('%cRefreshing world data: %O', 'font-weight: bold; font-size: 16px', action.payload);
      return { ...state, isLoaded: true, ...action.payload }
    default:
      return state;
  }
}
