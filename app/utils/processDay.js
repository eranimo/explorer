import moment from 'moment';
import _ from 'lodash';

// import { Country, Pop, Hex, Province, CLASS_MAP, construct } from '../models/base';
import { CLASSES, construct } from '../models';

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

export default function processDay(timeline, worldData, enums, hexes, currentDay) {
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
  _.map(CLASSES, (classConstructor, key) => {
    newWorldData[key] = _.mapValues(newWorldData[key], (model) => {
      return construct(classConstructor(), key, [model, { data: newWorldData, enums, hexes }]);
    });
  });
  return newWorldData;
}
