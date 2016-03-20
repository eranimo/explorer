import _ from 'lodash';

function isIDString(value) {
  return _.isString(value) && value.length === 35 && value[2] === '-';
}

export const CLASSES = {
  Province: () => Province,
  Country: () => Country,
  Pop: () => Pop,
  Hex: () => Hex
};

export const KEYWORD_MAP = {
  'pr': { key: 'Province', className: () => Province },
  'co': { key: 'Country', className: () => Country },
  'po': { key: 'Pop', className: () => Pop },
  'he': { key: 'Hex', className: () => Hex }
};

function namedFunction(name, args, body, scope, values) {
    if (typeof args == "string")
        values = scope, scope = body, body = args, args = [];
    if (!Array.isArray(scope) || !Array.isArray(values)) {
        if (typeof scope == "object") {
            var keys = Object.keys(scope);
            values = keys.map(function(p) { return scope[p]; });
            scope = keys;
        } else {
            values = [];
            scope = [];
        }
    }
    return Function(scope, "function "+name+"("+args.join(", ")+") {\n"+body+"\n}\nreturn "+name+";").apply(null, values);
};

export function construct(constructor, name, args) {
  const F = namedFunction(name, [], "return constructor.apply(this, args);", { constructor, args });
  F.prototype = constructor.prototype;
  return new F();
}

function processIDString(context, model, keyword, value, key, currentDay) {
  const foundClass = KEYWORD_MAP[keyword];
  Object.defineProperty(context, key, {
    get() {
      return construct(foundClass.className(), foundClass.key, [context.findModel(foundClass.key, model[key]), currentDay]);
    },
    set(newValue) {
      return construct(foundClass.className(), foundClass.key, [context.findModel(foundClass.key, newValue), currentDay]);
    }
  });
}

export class Base {
  constructor(model, currentDay) {
    this.__currentDay = currentDay;
    _.forEach(model, (value, key) => {
      if (isIDString(value)) {
        const keyword = value.substr(0, 2);
        processIDString(this, model, keyword, value, key, currentDay);
      } else if (_.isArray(value) && _.every(value, isIDString)) {
        // this[key] = [];
        // value.forEach((v, i) => {
        //   const keyword = value[i].substr(0, 2);
        //   processIDString(this[key], model, keyword, v, i, currentDay);
        // });
      } else {
        this[key] = value;
      }
    });
    // this.__model = model;
  }
  findModel(type, id) {
    try {
      return this.__currentDay[type][id];
    } catch (e) {
      throw Error('Cannot find ' + type + ' of ID ' + id);
    }
  }
}

export class Province extends Base {}
export class Country extends Base {}
export class Pop extends Base {}
export class Hex extends Base {}
