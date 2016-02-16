import { LOAD_WORLD_DATA, GET_HEX } from '../actions/world';

export default function counter(state = {}, action) {
  switch (action.type) {
    case LOAD_WORLD_DATA:
      return {
        ...state,
        details: action.data.details,
        hexes: action.data.hexes,
        geoforms: action.data.geoforms
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
