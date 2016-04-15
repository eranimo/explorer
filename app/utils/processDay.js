import moment from 'moment';
import _ from 'lodash';

// import { Country, Pop, Hex, Province, CLASS_MAP, construct } from '../models/base';
import { CLASSES, construct, isIDString, processIDString, evaluateRelationships } from '../models';

import { convertToMoment, momentToDateString } from './dates';


const changeActions = {
  set(data, change) {
    // data[change.key] = change.value;
    // return data;
    return {
      ...data,
      [change.key]: change.value
    }
  },
  update(data, change) {
    // data[change.key] = change.value;
    // return data;
    return {
      ...data,
      [change.key]: change.value
    }
  },
  set_index(data, change) {
    const index = change.key.match(/\[[0-9]+\]/)[0].substr(1, 1);
    const key = change.key.match(/[a-z]+/i)[0];
    let newData = _.cloneDeep(data);
    newData[key][index] = change.value;
    return newData;
    // return {
    //   ...data,
    //   [key]: [index]: change.value
    // }
  }
};

function transformDaysToMoment(dayChanges) {
  return _.zipWith(_.keys(dayChanges), _.values(dayChanges), (key, value) => {
    if (value) {
      return {
        modelChanges: value,
        jsDate: convertToMoment(key)
      };
    }
  });
}

/* Get the current day data from the timeline
 */
export default function processDay(timeline, worldData, enums, hexes, currentDay) {
  const dayString = momentToDateString(convertToMoment(currentDay))


  let today = {};
  _.map(worldData, (v, modelType) => {
    today[modelType] = timeline[modelType][dayString];
  });


  // instantiate classes
  const worldInfo = { data: today, enums, hexes }
  _.map(CLASSES, (classConstructor, key) => {
    today[key] = _.mapValues(today[key], (model, idNum) => {
      //console.log('process', model)
      model.id = idNum;
      return construct(classConstructor(), key, [model, worldInfo]);
    });
  });
  console.log(today)

  return today;
}
