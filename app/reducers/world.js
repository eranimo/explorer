import { LOAD_WORLD_DATA, SELECT_DAY } from '../actions/world';

const INITIAL_STATE = {
  isLoaded: false
};
import { convertToMoment } from '../utils/dates';


export default function world(state = INITIAL_STATE, action) {
  switch (action.type) {
    case LOAD_WORLD_DATA:
      console.log('%cLoaded world data: %O', 'font-weight: bold; font-size: 16px', action.data);
      return {
        ...state,
        isLoaded: true,
        details: action.data.details,
        hexes: action.data.hexes,
        enums: action.data.enums,
        geoforms: action.data.geoforms,
        timeline: action.data.timeline,
        data: action.data.data,
        timeRange: {
          start: convertToMoment(action.data.times.start_day),
          end: convertToMoment(action.data.times.end_day)
        }
      };
    default:
      return state;
  }
}
