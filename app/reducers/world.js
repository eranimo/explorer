import { LOAD_WORLD_DATA, GET_HEX, SELECT_DAY } from '../actions/world';
import moment from 'moment';
import _ from 'lodash';

const INITIAL_STATE = {};

const DAY_FORMAT = 'YYYY-MM-DD';


const changeActions = {
  set(data, change) {
    _.forEach(change.change, (value, key) => {
      data[change.type][change.id][key] = value;
    });
  },
  extend(data, change) {
    _.forEach(change.change, (value, key) => {
      data[change.type][change.id][key] = _.concat(data[change.type][change.id][key], value);
    });
  }
};

function processDay(timeline, worldData, currentDay) {
  const timelineArray = _.zipWith(_.keys(timeline), _.values(timeline), (date, changes) => {
    return { date, changes };
  });
  const currentDayObj = moment(currentDay, DAY_FORMAT);

  const days = _(timelineArray)
    .map((data) => {
      return {
        ...data,
        jsDate: moment(data.date, DAY_FORMAT).toDate()
      };
    })
    .filter(({ jsDate }) => {
      return jsDate <= currentDayObj;
    })
    .value();

  const newWorldData = worldData;
  for (const day of days) {
    for (const change of day.changes) {
      changeActions[change.action](newWorldData, change);
    }
  }
  return newWorldData;
}


export default function counter(state = INITIAL_STATE, action) {
  switch (action.type) {
    case LOAD_WORLD_DATA:
      return {
        ...state,
        details: action.data.details,
        hexes: action.data.hexes,
        geoforms: action.data.geoforms,
        timeline: action.data.timeline,
        data: action.data.data,
        currentDay: processDay(action.data.timeline, action.data.data, '0001-01-01')
      };
    case GET_HEX:
      return {
        ...state,
        hex: action.data
      };
    case SELECT_DAY:
      return {
        ...state,
        currentDay: processDay(state.timeline, action.day)
      };
    default:
      return state;
  }
}
