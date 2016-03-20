import _ from 'lodash';

export class Country {
  constructor(model, currentDay) {
    base(model, currentDay, this);
  }
}

export class Pop {
  constructor(model, currentDay) {
    base(model, currentDay, this);
  }
}

export class Province {
  constructor(model, currentDay) {
    base(model, currentDay, this);
  }
}

export class Hex {
  constructor(model, currentDay) {
    base(model, currentDay, this);
  }
}

export const CLASS_MAP = { Province, Country, Pop, Hex };

export const KEYWORD_MAP = {
  'pr': { key: 'Province', className: Province },
  'co': { key: 'Country', className: Country },
  'po': { key: 'Pop', className: Pop },
  'he': { key: 'Hex', className: Hex },
};

export function construct(constructor, args) {
  function F() {
    return constructor.apply(this, args);
  }
  F.prototype = constructor.prototype;
  return new F();
}

function isIDString(value) {
  return _.isString(value) && value.length === 35 && value[2] === '-';
}

function processIDString(context, key, value, currentDay) {
  const keyword = value.substr(0, 2);
  const foundClass = KEYWORD_MAP[keyword];
  const foundModel = currentDay[foundClass.key][value];
  Object.defineProperty(context, key, {
    get() {
      return construct(foundClass.className, [foundModel, currentDay]);
    },
    set(newValue) {
      return construct(foundClass.className, [newValue, currentDay]);
    }
  });
}

function base(model, currentDay, context) {
  _.forEach(model, (value, key) => {
    if (isIDString(value)) {
      processIDString(context, key, value, currentDay);
    } else if (_.isArray(value) && _.every(value, isIDString)) {
      // _.forEach(value, (v) => {
      //   processIDString(context, key, v, currentDay);
      // });
    } else {
      context[key] = value;
    }
  });
}
