import moment from 'moment';
import _ from 'lodash';

// import { Country, Pop, Hex, Province, CLASS_MAP, construct } from '../models/base';
import { CLASSES, construct, isIDString, processIDString, evaluateRelationships } from '../models';

import { convertToMoment } from './dates';


const changeActions = {
  set(data, change) {
    //console.log(data, change)
    data[change.key] = change.value;
    // console.log('SET', change.key, change.value)
    return data;
  },
  update(data, change) {
    data[change.key] = change.value;
    // console.log('UPDATE', change.key, change.value)
    return data;
  },
  set_index(data, change) {
    const index = change.key.match(/\[[0-9]+\]/)[0].substr(1, 1);
    const key = change.key.match(/[a-z]+/i)[0];
    data[key][index] = change.value;
    // console.log('SET_INDEX', key, index, change.value)
    return data;
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

export default function processDay(timeline, worldData, enums, hexes, currentDay) {
  console.groupCollapsed("Processing Day Changes");
  const currentDayObj = convertToMoment(currentDay);
  // console.log('Pre-changed world data: %O', _.cloneDeep(worldData))

  const changesToday = _.zipWith(_.keys(timeline), _.values(timeline), (model, days) => {
    return {
      model,
      days: _.orderBy(_.filter(transformDaysToMoment(days), ({ jsDate }) => {
        return jsDate <= currentDayObj;
      }), 'jsDate', 'asc')
    };
  });

  console.log('Changes today: %O', changesToday);

  // apply all changes to object model
  const newWorldData = _.cloneDeep(worldData);
  const worldInfo = { data: newWorldData, enums, hexes }
  changesToday.forEach(({ model, days }) => {
    days.forEach(({ modelChanges }) => {
      _.each(modelChanges, (changes, key) => {
        changes.forEach((change) => {
          // console.log(newWorldData[model], key)
          if (!newWorldData[model][key]) {
            console.log('created new: ', model, key)
            newWorldData[model][key] = {}
          }
          newWorldData[model][key] = changeActions[change.type](newWorldData[model][key], _.cloneDeep(change));
        });
      });
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
        evaluateRelationships(model, key, value, worldInfo)
      })
    });
  });
  console.log('Post-instantiated world data;: %O', newWorldData);
  console.groupEnd();
  return newWorldData;
}
