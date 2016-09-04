export class EnumSymbol {
  sym = Symbol.for(name);

  constructor(name, props) {
    _.forEach(props, (value, key) => {
      this[key] = value;
    });

    Object.freeze(this);
  }

  get display() {
    return Symbol.keyFor(this.sym);
  }

  toString() {
    return this.sym;
  }

  valueOf() {
    return this.value;
  }
}

export class Enum {
  constructor(enumLiterals) {
    for (let key in enumLiterals) {
      if (!enumLiterals[key]) throw new TypeError('each enum should have been initialized with atleast empty {} value');
      this[key] = new EnumSymbol(key, enumLiterals[key]);
    }
    Object.freeze(this);
  }

  symbols() {
    // return [for (key of Object.keys(this)) this[key] ];
    const result = [];
    for (const key of Object.keys(this)) {
      result.push(this[key]);
    }
    return result;
  }

  keys() {
    return Object.keys(this);
  }

  contains(sym) {
    if (!(sym instanceof EnumSymbol)) return false;
    return this[Symbol.keyFor(sym.sym)] === sym;
  }

  *[Symbol.iterator]() {
    for (const key of Object.keys(this)) {
      yield this[key];
    }
  }
}
