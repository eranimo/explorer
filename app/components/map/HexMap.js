import { midPoint, array2D } from 'utils/canvas'; // eslint-disable-line


/* An representation of a Hexagon grid map
 * Does not know about the browser or any canvas
 */
export default class HexMap {
  mapState = {
    coord: {
      x: 0,
      y: 0
    },
    loc: {
      x: 0,
      y: 0
    },
    z: 1,
    minimap: {},
    selecting: false,
    panning: false
  };

  constructor(hexes) {
    this.size = hexes.length;
    this.grid = hexes;
    this.hexNeighbors = array2D(this.size, null);

    // compute some hex constants
    this.SIDELENGTH = 25;
    this.HEXAGONANGLE = 30 * Math.PI / 180;
    this.BOARDHEIGHT = this.size;
    this.BOARDWIDTH = this.size;
    this.HEXHEIGHT = Math.sin(this.HEXAGONANGLE) * this.SIDELENGTH;
    this.HEXRADIUS = Math.cos(this.HEXAGONANGLE) * this.SIDELENGTH;
    this.HEXRECTHEIGHT = this.SIDELENGTH + 2 * this.HEXHEIGHT;
    this.HEXRECTWIDTH = 2 * this.HEXRADIUS;
  }

  /**
   * Gets the coordinates of the top left and bottom right visible hex
   * @return {Object{x1, y1, x2, y2}}   Coordinates Object
   */
  getVisibleArea() {
    const topLeft = this.screenToCoordinate(0, 0);
    const bottomRight = this.screenToCoordinate(this.getWidth(), this.getHeight());
    const one = this.coordinateToHex(topLeft.x, topLeft.y, true);
    const two = this.coordinateToHex(bottomRight.x, bottomRight.y, true);
    const offset = Math.round(7 / this.mapState.z);
    return {
      x1: Math.max(Math.min(one.x - offset, this.size), 0),
      y1: Math.max(Math.min(one.y - offset, this.size), 0),
      x2: Math.max(Math.min(two.x + offset, this.size), 0),
      y2: Math.max(Math.min(two.y + offset, this.size), 0)
    };
  }

  /**
   * Converts a screen coordinate to a map coordinate
   * @param  {Number} offsetX Screen coordinate X
   * @param  {Number} offsetY Screen coordinate Y
   * @return {Object{Number, Number}}    Map coordinate pair
   */
  screenToCoordinate(offsetX, offsetY) {
    return {
      x: (-(this.mapState.loc.x) + (offsetX) * this.mapState.z),
      y: (-(this.mapState.loc.y) + (offsetY) * this.mapState.z)
    };
  }

  /**
   * Converts coordinates for zooming
   * @param  {Number} input X or Y coordinate
   * @return {Number}     The number with zooming accounted for
   */
  r(input) {
    return input / this.mapState.z;
  }

  // get a cell object
  // cx and cy: X and Y index inside grid
  getCell(cx, cy) {
    // origin points: relative to screen
    const originX = cy * this.HEXRECTWIDTH + ((cx % 2) * this.HEXRADIUS);
    const originY = cx * (this.SIDELENGTH + this.HEXHEIGHT);

    // screen points: relative to the canvas origin (top left of screen)
    const screenX = this.mapState.loc.x + originX;
    const screenY = this.mapState.loc.y + originY;

    // the hex object
    const hex = this.grid[cx][cy];
    return { originX, originY, screenX, screenY, cx, cy, hex };
  }

  // loop over all hexes that are visible right now
  // Returns a generator
  *forAllVisibleHexes() {
    const visible = this.getVisibleArea();
    for (let cy = visible.x1; cy < visible.x2; ++cy) {
      for (let cx = visible.y1; cx < visible.y2; ++cx) {
        yield this.getCell(cx, cy);
      }
    }
  }

  /**
   * Converts a map coordinate to a hex coordinate
   * @param  {Number} x Map Coordinate X
   * @param  {Number} y Map Coordinate Y
   * @param  {Boolean} in_bounds Keep the coordinate in bounds
   * @return {Object{Number, Number}}   Hex coordinate pair
   */
  coordinateToHex(x, y, inBounds) {
    const h = (Math.sin(this.HEXAGONANGLE) * this.SIDELENGTH);
    const r = (Math.cos(this.HEXAGONANGLE) * this.SIDELENGTH);
    const HEXWIDTH = 2 * r;
    const HEXHEIGHT = h + this.SIDELENGTH;
    const xSection = Math.floor(x / HEXWIDTH);
    const ySection = Math.floor(y / HEXHEIGHT);
    const xSectionPixel = Math.floor(x % HEXWIDTH);
    const ySectionPixel = Math.floor(y % HEXHEIGHT);
    const m = h / r; // slope of Hex points

    let ArrayX = xSection;
    let ArrayY = ySection;

    if (ySection % 2 === 0) {
      if (ySectionPixel < (h - xSectionPixel * m)) { // left Edge
        ArrayY = ySection - 1;
        ArrayX = xSection - 1;
      } else if (ySectionPixel < (-h + xSectionPixel * m)) { // right Edge
        ArrayY = ySection - 1;
        ArrayX = xSection;
      }
    } else {
      if (xSectionPixel >= r) {
        // Right side
        if (ySectionPixel < (2 * h - xSectionPixel * m)) {
          ArrayY = ySection - 1;
          ArrayX = xSection;
        } else {
          ArrayY = ySection;
          ArrayX = xSection;
        }
      } else {
        // Left side
        if (ySectionPixel < xSectionPixel * m) {
          ArrayY = ySection - 1;
          ArrayX = xSection;
        } else {
          ArrayY = ySection;
          ArrayX = xSection - 1;
        }
      }
    }

    if (inBounds) {
      return {
        x: ArrayX,
        y: ArrayY
      };
    }

    if (ArrayY <= this.size && ArrayY >= 0 && ArrayX <= this.size && ArrayX >= 0) {
      return {
        x: ArrayX,
        y: ArrayY
      };
    }
    return null;
  }

  getHexNeighbors(x, y) {
    // if (this.hexNeighbors[x][y]) {
    //   return this.hexNeighbors[x][y];
    // }
    // console.log(this.grid);

    let east;
    if (y === this.size - 1) {
      east = this.grid[x][0];
    } else {
      east = this.grid[x][y + 1];
    }

    let west;
    if (y === 0) {
      west = this.grid[x][this.size - 1];
    } else {
      west = this.grid[x][y - 1];
    }

    let north_west;
    if (x === 0) {
      north_west = this.grid[0][Math.round(y / -1 + this.size - 1)];
    } else if (y === 0 && x % 2 === 0) {
      north_west = this.grid[x - 1][this.size - 1];
    } else {
      if (x % 2 === 0) {
        north_west = this.grid[x - 1][y - 1];
      } else {
        north_west = this.grid[x - 1][y];
      }
    }

    let north_east;
    if (x === 0) {
      north_east = this.grid[0][Math.round(y / -1 + this.size - 1)];
    } else if (y === this.size - 1 && x % 2 === 1) { // right of map and x is odd
      north_east = this.grid[x - 1][0];
    } else {
      if (x % 2 === 0) {
        north_east = this.grid[x - 1][y];
      } else {
        north_east = this.grid[x - 1][y + 1];
      }
    }

    let south_west;
    if (x === this.size - 1) {
      south_west = this.grid[this.size - 1][Math.round(y / -1 + this.size - 1)];
    } else if (y === 0 && x % 2 === 1) {
      south_west = this.grid[x + 1][this.size - 1];
    } else if (y === 0 && x % 2 === 0) {
      south_west = this.grid[x + 1][0];
    } else {
      if (x % 2 === 0) {
        south_west = this.grid[x + 1][y - 1];
      } else {
        south_west = this.grid[x + 1][y];
      }
    }

    let south_east;
    if (x === this.size - 1) {
      south_east = this.grid[this.size - 1][Math.round(y / -1 + this.size - 1)];
    } else if (y === this.size - 1 && x % 2 === 1) {
      south_east = this.grid[x + 1][0];
    } else {
      if (x % 2 === 0) {
        south_east = this.grid[x + 1][y];
      } else {
        south_east = this.grid[x + 1][y + 1];
      }
    }

    this.hexNeighbors[x][y] = {
      east, west, north_west, north_east, south_west, south_east
    };
    return this.hexNeighbors[x][y];
  }

  getHexSidePoints(x, y) {
    const cacheKey = `${x}-${y}`;
    if (this.hexPointsCache[cacheKey]) {
      return this.hexPointsCache[cacheKey];
    }

    const origin = [this.r(x + this.HEXRADIUS), this.r(y)];
    const pointer1 = [
      this.r(x) + this.r(this.HEXRECTWIDTH),
      this.r(y + this.HEXHEIGHT)
    ];
    const pointer2 = [
      this.r(x) + this.r(this.HEXRECTWIDTH),
      this.r(y + this.HEXHEIGHT + this.SIDELENGTH)
    ];
    const pointer3 = [
      this.r(x) + this.r(this.HEXRADIUS),
      this.r(y + this.HEXRECTHEIGHT)
    ];
    const pointer4 = [
      this.r(x),
      this.r(y + this.SIDELENGTH + this.HEXHEIGHT)
    ];
    const pointer5 = [
      this.r(x),
      this.r(y + this.HEXHEIGHT)
    ];

    const points = {
      north: origin,
      north_east: pointer1,
      south_east: pointer2,
      south: pointer3,
      south_west: pointer4,
      north_west: pointer5
    };
    this.hexPointsCache[cacheKey] = points;
    return points;
  }

  getHexMidpoint(hex) {
    const { screenX, screenY } = this.getCell(hex.x, hex.y);
    return midPoint(_.values(this.getHexSidePoints(screenX, screenY)));
  }

  hexToCoordinate(x, y) {
    return {
      x: y * this.HEXRECTWIDTH + ((x % 2) * this.HEXRADIUS),
      y: x * (this.SIDELENGTH + this.HEXHEIGHT)
    };
  }
}
