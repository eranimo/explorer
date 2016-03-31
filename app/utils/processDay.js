import moment from 'moment';
import _ from 'lodash';

// import { Country, Pop, Hex, Province, CLASS_MAP, construct } from '../models/base';
import { CLASSES, construct, isIDString, processIDString } from '../models';

const DAY_FORMAT = 'YYYY-MM-DD';


const changeActions = {
  set(data, change) {
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
        jsDate: moment(key, DAY_FORMAT)
      };
    }
  });
}

export default function processDay(timeline, worldData, enums, hexes, currentDay) {
  const currentDayObj = moment(currentDay, DAY_FORMAT);
  //console.log('pre-changed world data', _.cloneDeep(worldData))

  const changesToday = _.zipWith(_.keys(timeline), _.values(timeline), (model, days) => {
    return {
      model,
      days: _.orderBy(_.filter(transformDaysToMoment(days), ({ jsDate }) => {
        return jsDate <= currentDayObj;
      }), 'jsDate', 'asc')
    };
  });

  console.log('changes today', changesToday);

  // apply all changes to object model
  const newWorldData = _.cloneDeep(worldData);
  changesToday.forEach(({ model, days }) => {
    days.forEach(({ modelChanges }) => {
      _.each(modelChanges, (changes, key) => {
        changes.forEach((change) => {
          console.log(change);
          newWorldData[model][key] = changeActions[change.type](newWorldData[model][key], _.cloneDeep(change));
          // console.log(_.clone(newWorldData[model][key]))
        });
      });
    });
  });
  console.log('post-changed world data', _.clone(newWorldData))

  // instantiate classes
  _.map(CLASSES, (classConstructor, key) => {
    newWorldData[key] = _.mapValues(newWorldData[key], (model) => {
      //console.log('process', model)
      return construct(classConstructor(), key, [model, { data: newWorldData, enums, hexes }]);
    });
  });
  console.log('world data', newWorldData);
  return newWorldData;
}
