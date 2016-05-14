import { convertToMoment } from 'utils/dates'
import { LOAD_WORLD_DATA, SELECT_DAY } from '../actions/world'

const INITIAL_STATE = {
  isLoaded: false,
  timeline: {},
  data: {},
  timeRange: {
    start: convertToMoment('0001-01-01'),
    end: convertToMoment('0001-01-01')
  }
};


export default function world(state = INITIAL_STATE, action) {
  switch (action.type) {
    case LOAD_WORLD_DATA:
      console.log('%cLoaded world data: %O', 'font-weight: bold; font-size: 16px', action.data);
      return {
        ...state,
        isLoaded: true,
        ...action.data
      };
    default:
      return state;
  }
}
