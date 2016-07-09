import processDay from '../utils/processDay';
import moment from 'moment';
import { convertToMoment, momentToDateString } from 'utils/dates'

import {
  PLAY,
  PAUSE,
  PREV_DAY,
  NEXT_DAY,
  FETCH_NEXT_DAY,
  FETCH_FIRST_DAY,
  GO_TO_DAY,
  SLOWER,
  FASTER,
  IS_LOADING,
  LOAD_HISTORY
} from '../actions/time';

function wrapDate(date) {
  return moment(date, 'YYYY-MM-DD');
}

const MIN_SPEED = 1;
const MAX_SPEED = 3;

const INITIAL_STATE = {
  currentDay: wrapDate('0001-01-01'), // moment object of current day
  lastFetchedDay: wrapDate('0001-01-01'), // last day we have fetched
  dayIndex: 0, // index of current day in the timeline
  speed: MIN_SPEED, // how fast the simulation is running
  timeline: [], // an array of all days in history
  dayData: {}, // current timeline day data
  isPlaying: false, // actively fetching new days in a loop
  isLoading: true,
  worldData: {} // enums, hexes,
};
window.speed = MIN_SPEED;

function limitBetween(low, high, value) {
  return Math.max(Math.min(value, high), low);
}

export default function time(state = INITIAL_STATE, action) {
  let speed;
  switch (action.type) {
    // time controls
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

    // day changing
    case PREV_DAY:
      if (state.currentDay === INITIAL_STATE.currentDay) {
        return { ...state };
      }
      let dayIndex = state.dayIndex - 1;
      return {
        ...state,
        currentDay: wrapDate(state.currentDay).subtract(1, 'day'),
        dayIndex,
        dayData: state.timeline[dayIndex].data
      };

    case NEXT_DAY:
      dayIndex = state.dayIndex + 1;
      return {
        ...state,
        currentDay: wrapDate(state.currentDay).add(1, 'day'),
        dayIndex,
        dayData: state.timeline[dayIndex].data
      };
    case FETCH_FIRST_DAY:
      return {
        ...state,
        dayData: state.timeline[0].data
      }
    case GO_TO_DAY:
      const newDay = wrapDate(action.payload);
      const dayDiff = state.dayIndex + newDay.diff(state.currentDay, 'day');
      return {
        ...state,
        currentDay: newDay,
        dayIndex: dayDiff,
        dayData: state.timeline[dayDiff].data
      };

    // time speed controls
    case SLOWER:
      speed = limitBetween(MIN_SPEED, MAX_SPEED, state.speed - 1);
      window.speed = speed;
      return { ...state, speed };

    case FASTER:
      speed = limitBetween(MIN_SPEED, MAX_SPEED, state.speed + 1);
      window.speed = speed;
      return { ...state, speed };

    case LOAD_HISTORY:
      const { world_data, days } = action.payload
      let lastDay;
      const processedDays = days.map(({ data, day }) => {
        lastDay = day;
        return {
          day: day,
          data: processDay(data, world_data.enums, world_data.hexes)
        };
      });
      return {
        ...state,
        worldData: world_data,
        isLoading: false,
        timeline: processedDays,
        dayIndex: processedDays.length - 1,
        currentDay: wrapDate(lastDay),
        dayData: _.last(processedDays).data,
        lastFetchedDay: lastDay
      }


    // get the next day from the server
    // and store it in the timeline
    case FETCH_NEXT_DAY:
      const { data, day, enums, hexes } = action.payload;
      console.log('Fetching the next day');
      const dayData = processDay(data, state.worldData.enums, state.worldData.hexes);
      return {
        ...state,
        timeline: [
          ...state.timeline,
          {
            day,
            data: dayData
          }
        ],
        isLoading: false,
        lastFetchedDay: day
      };
      return state;

    case IS_LOADING:
      return {
        ...state,
        isLoading: true
      }

    default:
      return state;
  }
}
