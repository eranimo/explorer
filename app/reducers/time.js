import processDay from '../utils/processDay';
import moment from 'moment';

import {
  PLAY,
  PAUSE,
  PREV_DAY,
  NEXT_DAY,
  GET_DAY_DATA,
  GO_TO_DAY,
  SLOWER,
  FASTER
} from '../actions/time';

function wrapDate(date) {
  return moment(date, 'YYYY-MM-DD');
}

const MIN_SPEED = 1;
const MAX_SPEED = 3;

const INITIAL_STATE = {
  currentDay: wrapDate('0001-01-01'),
  speed: MIN_SPEED,
  dayData: null,
  timeline: {},
  isPlaying: false
};
window.speed = MIN_SPEED;

function limitBetween(low, high, value) {
  return Math.max(Math.min(value, high), low);
}

export default function counter(state = INITIAL_STATE, action) {
  let speed;
  switch (action.type) {
    case PLAY:
      return {
        ...state,
        isPlaying: true
      };
    case PAUSE:
      return {
        ...state,
        isPlaying: false
      };
    case PREV_DAY:
      if (state.currentDay === INITIAL_STATE.currentDay) {
        return { ...state };
      }
      return {
        ...state,
        currentDay: wrapDate(state.currentDay).subtract(1, 'day')
      };
    case NEXT_DAY:
      return {
        ...state,
        currentDay: wrapDate(state.currentDay).add(1, 'day')
      };
    case SLOWER:
      speed = limitBetween(MIN_SPEED, MAX_SPEED, state.speed - 1);
      window.speed = speed;
      return { ...state, speed };
    case FASTER:
      speed = limitBetween(MIN_SPEED, MAX_SPEED, state.speed + 1);
      window.speed = speed;
      return { ...state, speed };
    case GET_DAY_DATA:
      const { timeline, data, enums, hexes } = action.data;
      const cachedDayData = state.timeline[state.currentDay];
      if (cachedDayData) {
        console.log('%cToday\s data (cached): %O', 'font-weight: bold', cachedDayData);
        return { ...state, dayData: cachedDayData }
      } else {
        const dayData = processDay(timeline, data, enums, hexes, state.currentDay);
        console.log('%cToday\s data: %O', 'font-weight: bold', dayData);
        console.log(state)
        return {
          ...state,
          dayData,
          timeline: {
            ...state.timeline,
            [state.currentDay]: dayData
          }
        };
      }
    case GO_TO_DAY:
      console.log(action.data)
      return {
        ...state,
        currentDay: wrapDate(action.data)
      };
    default:
      return state;
  }
}