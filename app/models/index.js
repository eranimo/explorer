import _ from 'lodash';

export function isIDString(value) {
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

export function processIDString(context, key, id, classKeyword, worldInfo) {
  const foundClass = KEYWORD_MAP[classKeyword];
  Object.defineProperty(context, key, {
    get() {
      const newModel = worldInfo.data[foundClass.key][id];
      return construct(foundClass.className(), foundClass.key, [newModel.__model, worldInfo, true]);
    },
    enumerable: true
  });
}

export function evaluateRelationships(model, key, value, worldInfo){
  if (isIDString(value)) {
    const keyword = value.substr(0, 2);
    processIDString(model, key, value, keyword, worldInfo);
  } else if (_.isArray(value) && _.every(value, isIDString)) {
    model[key] = [];
    value.forEach((v, i) => {
      const keyword = value[i].substr(0, 2);
      processIDString(model[key], i, v, keyword, worldInfo);
    });
  }
  return model
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

function evaluate(model, key, value, worldInfo) {
  if (isEnum(value)) {
    model[key] = processEnumObject(worldInfo.enums, value);
  } else if (_.isObject(value) && value.x && value.y) {
    model[key] = worldInfo.hexes[value.x][value.y];
  } else if (_.isObject(value)) {
    let new_obj = _.isArray(value) ? [] : {};
    _.each(value, (v, k) => {
      evaluate(new_obj, k, v, worldInfo);
    });
    model[key] = new_obj;
  } else {
    model[key] = value;
  }
  evaluateRelationships(model, key, value, worldInfo)
}

export class Base {
  constructor(model, worldInfo) {
    this.__model = _.clone(model);
    _.forEach(this.__model, (value, key) => {
      if (key === '__model') {
        return;
      }
      if (key === 'id') {
        this[key] = value;
        return;
      }
      evaluate(this, key, value, worldInfo);
    });
  }
}

export class Province extends Base {}
export class Country extends Base {}
export class Pop extends Base {}
