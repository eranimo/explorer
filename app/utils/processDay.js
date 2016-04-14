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

let cachedChanges = {};
let cachedModels = {}
let lastCachedDay;

export default function processDay(timeline, worldData, enums, hexes, currentDay) {
  const currentDayObj = convertToMoment(currentDay);
  console.groupCollapsed("Processing Day Changes");
  // console.log('Pre-changed world data: %O', _.cloneDeep(worldData))
  let changesToday;
  if (cachedChanges[currentDay]) {
    changesToday = cachedChanges[currentDay];
  } else {
    changesToday = _.zipWith(_.keys(timeline), _.values(timeline), (model, days) => {
      return {
        model,
        days: _.orderBy(_.filter(transformDaysToMoment(days), ({ jsDate }) => {
          return jsDate <= currentDayObj;
        }), 'jsDate', 'asc')
      };
    });
    cachedChanges[currentDay] = changesToday;
  }

  console.log('Changes today: %O', changesToday);

  // apply all changes to object model
  const newWorldData = _.cloneDeep(worldData);
  const worldInfo = { data: newWorldData, enums, hexes }
  changesToday.forEach(({ model, days }) => {
    // if we have a cached day, jump to it
    days.forEach(({ jsDate, modelChanges }) => {

      _.each(modelChanges, (changes, key) => {
        const cacheKey = jsDate + model + key;
        if (cachedModels[cacheKey]) {
          newWorldData[model][key] = cachedModels[cacheKey];
        } else {
          changes.forEach((change) => {
            if (!newWorldData[model][key]) {
              //console.log('created new: ', model, key)
              newWorldData[model][key] = {}
            }
            let sourceModel;
            newWorldData[model][key] = changeActions[change.type](newWorldData[model][key], _.cloneDeep(change));
            newWorldData[model][key].id = key;
          });
          cachedModels[cacheKey] = newWorldData[model][key];
        }
      });

      if (!lastCachedDay || lastCachedDay < jsDate) {
        lastCachedDay = jsDate;
      }
    });
  });

  console.log('Post-changed world data: %O', _.clone(newWorldData))

  // instantiate classes
  _.map(CLASSES, (classConstructor, key) => {
    newWorldData[key] = _.mapValues(newWorldData[key], (model) => {
      //console.log('process', model)
      return construct(classConstructor(), key, [model, worldInfo]);
    });
  });

  // resolve lookups

  _.each(newWorldData, (models, modelType) => {
    _.each(models, (model, modelId) => {
      _.each(model, (value, key) => {
        if (key !== 'id') {
          evaluateRelationships(model, key, value, worldInfo)
        }
      })
    });
  });
  console.log('Post-instantiated world data;: %O', newWorldData);
  console.groupEnd();
  return newWorldData;
}
