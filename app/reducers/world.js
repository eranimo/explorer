import { LOAD_WORLD_DATA, GET_HEX, SELECT_DAY } from '../actions/world';

const INITIAL_STATE = {};


export default function counter(state = INITIAL_STATE, action) {
  switch (action.type) {
    case LOAD_WORLD_DATA:
      console.log('%cLoaded world data: %O', 'font-weight: bold; font-size: 16px', action.data);
      return {
        ...state,
        details: action.data.details,
        hexes: action.data.hexes,
        enums: action.data.enums,
        geoforms: action.data.geoforms,
        timeline: action.data.timeline,
        data: action.data.data
      };
    case GET_HEX:
      return {
        ...state,
        hex: action.data
      };
    default:
      return state;
  }
}
