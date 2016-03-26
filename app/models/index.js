import _ from 'lodash';

function isIDString(value) {
  return _.isString(value) && value.length === 35 && value[2] === '-';
}

export const CLASSES = {
  Province: () => Province,
  Country: () => Country,
  Pop: () => Pop
};

export const KEYWORD_MAP = {
  'pr': { key: 'Province', className: () => Province },
  'co': { key: 'Country', className: () => Country },
  'po': { key: 'Pop', className: () => Pop }
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

function processIDString(context, model, keyword, value, key, worldInfo) {
  const foundClass = KEYWORD_MAP[keyword];
  Object.defineProperty(context, key, {
    get() {
      return construct(foundClass.className(), foundClass.key, [worldInfo.data[foundClass.key][model[key]], worldInfo]);
    },
    set(newValue) {
      return construct(foundClass.className(), foundClass.key, [worldInfo.data[foundClass.key][newValue], worldInfo]);
    }
  });
}

function isEnum(value) {
  return _.isObject(value) && value.type === 'enum';
}

function Enum(model) {
  _.forEach(model, (value, key) => {
    this[key] = value;
  });
}

function processEnumObject(enums, enumObj) {
  return new Enum(enums[enumObj.id][enumObj.key]);
}

export class Base {
  constructor(model, worldInfo) {
    _.forEach(model, (value, key) => {
      if (isIDString(value)) {
        const keyword = value.substr(0, 2);
        processIDString(this, model, keyword, value, key, worldInfo);
      } else if (_.isArray(value) && _.every(value, isIDString)) {
        this[key] = [];
        value.forEach((v, i) => {
          const keyword = value[i].substr(0, 2);
          processIDString(this[key], model[key], keyword, v, i, worldInfo);
        });
      } else if (isEnum(value)) {
        this[key] = processEnumObject(worldInfo.enums, value);
      } else if (_.isObject(value) && value.x && value.y) {
        this[key] = worldInfo.hexes[value.x][value.y];
      } else {
        this[key] = value;
      }
    });
    this.__model = model;
  }
}

export class Province extends Base {}
export class Country extends Base {}
export class Pop extends Base {}
