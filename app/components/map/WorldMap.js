import _ from 'lodash';
import jQuery from 'jquery';
import * as MAPVIEWS from './map_views.const';
import { hexToRgb, midPoint, drawStar } from 'utils/canvas'; // eslint-disable-line

const settings = {
  border_color_width: 3,
  zoom: {
    min: 2.0,
    max: 0.5,
    interval: 0.1
  }
};

const color = {
  rivers: '21, 52, 60'
};

console.log(1)
// const HEX_SIDES = {
//   north_east: { fromPoint: 'north', toPoint: 'north_east' },
//   east: { fromPoint: 'north_east', toPoint: 'south_east' },
//   south_east: { fromPoint: 'south_east', toPoint: 'south' },
//   south_west: { fromPoint: 'south', toPoint: 'south_west' },
//   west: { fromPoint: 'south_west', toPoint: 'north_west' },
//   north_west: { fromPoint: 'north_west', toPoint: 'north' },
// };

export default class WorldMap {

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

  provinceCache = {};
  hexPointsCache = {};

  constructor(hexes, canvases, mapView, currentDay, functions, mapDetails) {
    this.size = hexes.length;
    this.setMapView(mapView);
    this.functions = functions;
    const { mainCanvas, politicalMap, minimapCanvas, frameCanvas } = canvases;
    this.countries = currentDay.Country;
    this.mapDetails = mapDetails;
    this.canvas = {
      elem: jQuery(mainCanvas),
      context: mainCanvas.getContext('2d')
    };
    this.politicalMap = {
      elem: jQuery(politicalMap),
      context: politicalMap.getContext('2d')
    };
    this.minimapCanvas = {
      elem: jQuery(minimapCanvas),
      context: minimapCanvas.getContext('2d')
    };
    this.frameCanvas = {
      elem: jQuery(frameCanvas),
      context: frameCanvas.getContext('2d')
    };
    this.settings = {};

    // make grid
    this.grid = [];
    for (let i = 0; i < this.size; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.size; j++) {
        this.grid[i][j] = null;
      }
    }

    // add each hex
    this.grid = hexes;

    // set up sizes
    this.anchor = jQuery('.navbar-primary');
    jQuery(mainCanvas)
      .attr({
        width: jQuery(window).width(),
        height: jQuery(window).height() - this.anchor.height()
      });
    jQuery(politicalMap)
      .attr({
        width: jQuery(window).width(),
        height: jQuery(window).height() - this.anchor.height()
      });


    // list of hex coordinates
    // compute province borders
    this.no_borders = {
      north_east: [],
      east: [],
      south_east: [],
      south_west: [],
      west: [],
      north_west: []
    };
    this.country_borders = _.cloneDeep(this.no_borders);


    // compute some hex constants
    this.SIDELENGTH = 25;
    this.HEXAGONANGLE = 30 * Math.PI / 180;
    this.BOARDHEIGHT = this.size;
    this.BOARDWIDTH = this.size;
    this.HEXHEIGHT = Math.sin(this.HEXAGONANGLE) * this.SIDELENGTH;
    this.HEXRADIUS = Math.cos(this.HEXAGONANGLE) * this.SIDELENGTH;
    this.HEXRECTHEIGHT = this.SIDELENGTH + 2 * this.HEXHEIGHT;
    this.HEXRECTWIDTH = 2 * this.HEXRADIUS;

    this.mapWidth = this.BOARDWIDTH * this.HEXRECTWIDTH + ((this.BOARDHEIGHT % 2) * this.HEXRADIUS);
    this.mapHeight = this.BOARDHEIGHT * (this.SIDELENGTH + this.HEXHEIGHT);

    // events
    this.canvas.elem.css('cursor', 'pointer');
    this.politicalMap.elem.css('cursor', 'pointer');
    this.canvas.elem.on({
      mousedown: (e) => {
        this.mapState.coord = {
          x: e.screenX,
          y: e.screenY
        };
        this.canvas.elem.css('cursor', 'move');
        this.mapState.cursor = {
          x: e.pageX,
          y: e.pageY
        };
        this.mapState.panning = true;

        this.mapState.time_start = +new Date();
      },
      mouseup: (eventInfo) => {
        this.mapState.loc.x += (this.mapState.coord.x - eventInfo.screenX) / -1;
        this.mapState.loc.y += (this.mapState.coord.y - eventInfo.screenY) / -1;
        this.canvas.elem.css('cursor', 'pointer');
        this.mapState.panning = false;

        this.mapState.time_end = +new Date();

        const difference = this.mapState.time_end - this.mapState.time_start;
        if (this.hover_hex && difference < 100) {
          this.selectHex(this.hover_hex);
        }
      },
      mouseout: () => {
        this.hover_hex = null;
        if (this.mapState.selecting) {
          this.drawMain();
          this.mapState.selecting = false;
        }
        this.mapState.panning = false;
        this.canvas.elem.css('cursor', 'pointer');
      },
      mousemove: (e) => {
        if (this.mapState.panning) {
          const diff = {
            x: (this.mapState.coord.x - e.screenX) / -1,
            y: (this.mapState.coord.y - e.screenY) / -1
          };
          this.mapState.loc.x += diff.x * this.mapState.z;
          this.mapState.loc.y += diff.y * this.mapState.z;
          this.mapState.coord.x += diff.x;
          this.mapState.coord.y += diff.y;
        }
        this.mapState.cursorX = e.offsetX;
        this.mapState.cursorY = e.offsetY;

        const coord = this.screenToCoordinate(e.offsetX, e.offsetY);
        const hexPos = this.coordinateToHex(coord.x, coord.y);

        this.mapState.selecting = true;
        this.clearMap();


        // Check if the mouse's coords are on the board
        if (hexPos !== null && hexPos.x >= 0 && hexPos.x < this.BOARDWIDTH) {
          if (hexPos.y >= 0 && hexPos.y < this.BOARDHEIGHT) {
            const hex = this.grid[hexPos.y][hexPos.x];
            this.hover_hex = hex;
            this.hover_coordinates = coord;
          }
        }

        if (hexPos === null) {
          this.hover_hex = null;
        }

        this.drawMain();
        this.drawMinimapFrame();
      },
      mousewheel: (e) => {
        const delta = e.originalEvent.wheelDelta;
        if (delta < 0) {
          // up
          this.zoom('up', e);
        } else if (delta > 0) {
          // down
          this.zoom('down', e);
        }
        this.drawMinimapFrame();
        e.preventDefault();
      },
      contextmenu(e) {
        e.preventDefault();
      }
    });
    this.frameCanvas.elem.on({
      mousedown: (e) => {
        const offsetX = (e.offsetX || e.clientX - jQuery(e.target).offset().left);
        const offsetY = (e.offsetY || e.clientY - jQuery(e.target).offset().top);
        const cellX = ((offsetX / 200) * this.mapWidth);
        const cellY = ((offsetY / 200) * this.mapHeight);
        this.jump(cellX, cellY);
        this.mapState.minimap.hold = true;
        jQuery('#minimap').css('cursor', 'move');
      },
      mouseup: () => {
        this.mapState.minimap.hold = false;
        jQuery('#minimap').css('cursor', 'default');
      },
      mouseout: () => {
        this.mapState.minimap.hold = false;
        jQuery('#minimap').css('cursor', 'default');
      },
      mousemove: (e) => {
        const offsetX = (e.offsetX || e.clientX - jQuery(e.target).offset().left);
        const offsetY = (e.offsetY || e.clientY - jQuery(e.target).offset().top);
        if (this.mapState.minimap.hold) {
          jQuery('#minimap').css('cursor', 'crosshair');
          const x = ((offsetX / 200) * this.mapWidth);
          const y = ((offsetY / 200) * this.mapHeight);
          this.jump(x, y);
          this.mapState.minimap.hold = true;
        }
      },
      contextmenu(e) {
        e.preventDefault();
      }
    });
    window.canvasEventHandler = jQuery(window).on({
      keyup: (e) => {
        const code = e.keyCode;
        let delta = 40;
        if (e.shiftKey) {
          delta = 100;
        }
        if (code === 38) { // up
          this.move(0, delta);
        } else if (code === 40) { // down
          this.move(0, -delta);
        } else if (code === 37) { // left
          this.move(delta, 0);
        } else if (code === 39) { // right
          this.move(-delta, 0);
        } else if (code === 32) {
          this.zoom();
        }
      },
      resize: () => {
        this.resize();
      }
    });
    this.resize();
  }


  /**
   * destroy - Destroys World
   *
   * @return {type}  description
   */
  destroy() {
    this.canvas.elem.off();
    this.politicalMap.elem.off();
    this.minimapCanvas.elem.off();
    this.frameCanvas.elem.off();
    window.canvasEventHandler.off();
  }

  setMapView(mapView) {
    this.mapView = MAPVIEWS[mapView];
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

  getWidth() {
    return this.canvas.elem.width() * this.mapState.z;
  }
  getHeight() {
    return this.canvas.elem.height() * this.mapState.z;
  }

  resize() {
    this.canvas.elem
      .attr({
        width: jQuery(window).width(),
        height: jQuery(window).height()
      });
    this.drawAll();
  }

  /**
   * Draws the entire map and minimap
   */
  drawAll() {
    console.log('redrawing map');
    this.clearMap();
    this.drawMain();
    this.drawMinimap();
    this.canvas.context.translate(0.5, 0.5);
  }

  /**
   * Converts coordinates for zooming
   * @param  {Number} input X or Y coordinate
   * @return {Number}     The number with zooming accounted for
   */
  r(input) {
    return input / this.mapState.z;
  }

  drawMinimap() {
    const canvas = this.minimapCanvas.elem[0];
    canvas.width = 200;
    canvas.height = 200;
    const mctx = this.minimapCanvas.context;
    mctx.mozImageSmoothingEnabled = false;
    mctx.msImageSmoothingEnabled = false;
    mctx.imageSmoothingEnabled = false;
    const size = this.size;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const backingStoreRatio = mctx.webkitBackingStorePixelRatio ||
                mctx.mozBackingStorePixelRatio ||
                mctx.msBackingStorePixelRatio ||
                mctx.oBackingStorePixelRatio ||
                mctx.backingStorePixelRatio || 1;

    let ratio = (devicePixelRatio / backingStoreRatio);
    ratio = size / canvas.width;

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;

    canvas.style.width = `${oldWidth}px`;
    canvas.style.height = `${oldHeight}px`;
    mctx.scale(ratio, ratio);

    const canvasData = mctx.getImageData(0, 0, size, size);

    function drawPixel(x, y, r, g, b, a) {
      const index = (x + y * size) * 4;

      canvasData.data[index + 0] = r;
      canvasData.data[index + 1] = g;
      canvasData.data[index + 2] = b;
      canvasData.data[index + 3] = a;
    }

    function updateCanvas() {
      mctx.putImageData(canvasData, 0, 0);
    }
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const cell = this.grid[j][i];
        if (cell) {
          const foundProvince = this.findProvince(cell);
          let pcolor;
          if (foundProvince) {
            pcolor = hexToRgb(foundProvince.owner.display.map_color);
            drawPixel(i, j, pcolor.r, pcolor.g, pcolor.b, 255);
          } else {
            pcolor = cell.colors[this.mapView.map];
            drawPixel(i, j, pcolor[0], pcolor[1], pcolor[2], 255);
          }
        } else {
          drawPixel(i, j, 0, 0, 0, 255);
        }
      }
    }
    this.drawMinimapFrame();
    updateCanvas();
  }

  drawMinimapFrame() {
    // draw frame
    const frameLayer = this.frameCanvas.elem[0];
    const fctx = this.frameCanvas.context;
    const size = frameLayer.width;

    const x1 = ((-this.mapState.loc.x / this.mapWidth) * size) + 0.5;
    const y1 = ((-this.mapState.loc.y / this.mapHeight) * size) + 0.5;
    const x2 = ((this.getWidth() / this.mapWidth) * size);
    const y2 = ((this.getHeight() / this.mapHeight) * size);

    fctx.clearRect(0, 0, size, size);
    fctx.scale(1, 1);
    fctx.beginPath();
    fctx.rect(x1, y1, x2, y2);
    fctx.lineWidth = 1;
    fctx.strokeStyle = 'white';
    fctx.stroke();
  }


  /**
   * Draws the main world map
   */
  drawMain() {
    const ctx = this.canvas.context;
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 10;
    ctx.strokeWidth = 10;

    const visible = this.getVisibleArea();
    for (let i = visible.x1; i < visible.x2; ++i) {
      for (let j = visible.y1; j < visible.y2; ++j) {
        this.drawHexagon(
          i * this.HEXRECTWIDTH + ((j % 2) * this.HEXRADIUS),
          j * (this.SIDELENGTH + this.HEXHEIGHT),
          i,
          j
        );
      }
    }

    // for (let i = visible.x1; i < visible.x2; ++i) {
    //   for (let j = visible.y1; j < visible.y2; ++j) {
    //     this.drawProvinceBorders(
    //       i * this.HEXRECTWIDTH + ((j % 2) * this.HEXRADIUS),
    //       j * (this.SIDELENGTH + this.HEXHEIGHT),
    //       i,
    //       j
    //     );
    //   }
    // }

    // this.country_borders = _.cloneDeep(this.no_borders);
    // for (let i = visible.x1; i < visible.x2; ++i) {
    //   for (let j = visible.y1; j < visible.y2; ++j) {
    //     const hex = this.grid[j][i];
    //     const province = this.findProvince(hex);
    //     if (province) {
    //       //console.log(hex)
    //       const ownerId = province.owner.id;
    //       const neighbors = province.hex.neighbors;
    //       _.each(HEX_SIDES, ({ fromPoint, toPoint }, sideName) => {
    //         const foundHex = neighbors[sideName];
    //         const foundProvince = this.findProvince(foundHex);
    //         //console.log(hex.x, hex.y, sideName, foundProvince)
    //         if (!foundProvince) {
    //           // border with wilderness
    //           this.country_borders[sideName].push(province);
    //           //console.log('found wilderness')
    //         } else if (foundProvince && foundProvince.owner.id === ownerId) {
    //           // border with owned province
    //
    //         } else {
    //           // border with foreign province
    //           //this.country_borders[sideName].push(province);
    //         }
    //       });
    //     }
    //   }
    // }
    // ctx = this.politicalMap.context;
    // ctx.lineCap = 'round';
    // ctx.beginPath();
    // ctx.lineWidth = 2;
    // _.each(this.country_borders, (sides, sideName) => {
    //   const { fromPoint, toPoint } = HEX_SIDES[sideName];
    //   sides.forEach((province) => {
    //     console.log(`Drawing side ${sideName} for ${province.hex.x}, ${province.hex.y}`)
    //     const coordinate = this.hexToCoordinate(province.hex.x, province.hex.y);
    //     const x = Math.floor(this.mapState.loc.x + coordinate.x);
    //     const y = Math.floor(this.mapState.loc.y + coordinate.y);
    //     const points = this.getHexSidePoints(x, y);
    //     ctx.strokeStyle = province.owner.display.border_color;
    //     ctx.moveTo(points[fromPoint][0] - 1, points[fromPoint][1]);
    //     ctx.lineTo(points[toPoint][0] - 1, points[toPoint][1]);
    //     console.log(points[fromPoint][0] - 1, points[fromPoint][1]);
    //     console.log(points[toPoint][0] - 1, points[toPoint][1]);
    //   });
    // });
    // ctx.stroke();
    // ctx.closePath();


    if (this.mapView.rivers || this.mapView.borders) {
      for (let i = visible.x1; i < visible.x2; ++i) {
        for (let j = visible.y1; j < visible.y2; ++j) {
          this.drawEdges(
            i * this.HEXRECTWIDTH + ((j % 2) * this.HEXRADIUS),
            j * (this.SIDELENGTH + this.HEXHEIGHT),
            i,
            j
          );
        }
      }
    }

    // draw selected hex
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 10;
    ctx.strokeWidth = 10;

    const selectedHex = this.functions.getSelectedHex();
    if (selectedHex) {
      const coordinate = this.hexToCoordinate(selectedHex.x, selectedHex.y);
      const x = this.mapState.loc.x + coordinate.x;
      const y = this.mapState.loc.y + coordinate.y;

      const {
        north, north_east, south_east, south, south_west, north_west
      } = this.getHexSidePoints(x, y);

      ctx.beginPath();
      ctx.lineCap = 'square';
      ctx.lineWidth = this.r(3);
      const offset = 1;
      ctx.setLineDash([this.r(5), this.r(5)]);
      ctx.strokeStyle = 'rgb(0, 0, 0)';
      ctx.moveTo(north[0], north[1] + offset);
      ctx.lineTo(north_east[0] - offset, north_east[1]);
      ctx.moveTo(north_east[0] - offset, north_east[1]);
      ctx.lineTo(south_east[0] - offset, south_east[1]);
      ctx.moveTo(south_east[0] - offset, south_east[1]);
      ctx.lineTo(south[0], south[1] - offset);
      ctx.moveTo(south[0], south[1] - offset);
      ctx.lineTo(south_west[0] + offset, south_west[1]);
      ctx.moveTo(south_west[0] + offset, south_west[1]);
      ctx.lineTo(north_west[0] + offset, north_west[1]);
      ctx.moveTo(north_west[0] + offset, north_west[1]);
      ctx.lineTo(north[0], north[1] + offset);
      ctx.stroke();
      ctx.closePath();
      ctx.setLineDash([0, 0]);
    }

    ctx.font = '20pt Arial';
    ctx.textAlign = 'center';

    // draw countries
    _.mapValues(this.mapDetails.countries, (country) => {
      country.groups.forEach(({ x_coord, y_coord }) => {
        let { x, y } = this.hexToCoordinate(x_coord, y_coord);

        x = this.r(Math.round(this.mapState.loc.x + x));
        y = this.r(Math.round(this.mapState.loc.y + y));

        ctx.fillStyle = 'black';
        ctx.fillText(country.name, x, y);
        ctx.fillStyle = country.display.border_color;
        ctx.fillText(country.name, x - 1, y - 1);
      });
    });


    // draw tooltip
    if (this.hover_hex) {
      const foundProvince = this.findProvince(this.hover_hex);
      if (foundProvince) {
        let { x, y } = this.hexToCoordinate(this.hover_hex.x, this.hover_hex.y);

        x = Math.round(this.r(Math.round(this.mapState.loc.x + x)));
        y = Math.round(this.r(Math.round(this.mapState.loc.y + y)));

        const textSize = ctx.measureText(foundProvince.name);

        ctx.beginPath();
        ctx.fillStyle = 'rgb(25, 46, 54)';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.rect(x, y, Math.round(textSize.width - textSize.width * 0.35), 20);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.font = '14px Arial';
        ctx.fillStyle = '#C0C0C0';
        ctx.textAlign = 'start';
        ctx.fillText(foundProvince.name, x + 5, y + 15);
      }
    }
  }

  decideBorderWidth(province, side, ctx) {
    const neighbors = province.hex.neighbors;
    const ownerId = province.owner.id;
    const foundHex = this.grid[neighbors[side].x][neighbors[side].y];
    const foundProvince = this.findProvince(foundHex);

    // border with wilderness
    if (!foundProvince) {
      ctx.lineWidth = this.r(3);
      ctx.strokeStyle = province.owner.display.border_color;
      return 2;
    }

    // border with owned province
    if (foundProvince.owner.id === ownerId) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = province.owner.display.border_color;
      return 0;
    }

    // border with foreigh province
    ctx.lineWidth = this.r(3);
    ctx.strokeStyle = province.owner.display.border_color;
    return 3;
  }

  getHexSidePoints(x, y) {
    const cacheKey = `${x}-${y}`;
    if (this.hexPointsCache[cacheKey]) {
      return this.hexPointsCache[cacheKey];
    }

    const origin = [this.r(x + this.HEXRADIUS), this.r(y)];
    const pointer1 = [
      Math.floor(this.r(x) + this.r(this.HEXRECTWIDTH)),
      Math.floor(this.r(y + this.HEXHEIGHT))
    ];
    const pointer2 = [
      Math.floor(this.r(x) + this.r(this.HEXRECTWIDTH)),
      Math.floor(this.r(y + this.HEXHEIGHT + this.SIDELENGTH))
    ];
    const pointer3 = [
      Math.floor(this.r(x) + this.r(this.HEXRADIUS)),
      Math.floor(this.r(y + this.HEXRECTHEIGHT))
    ];
    const pointer4 = [
      Math.floor(this.r(x)),
      Math.floor(this.r(y + this.SIDELENGTH + this.HEXHEIGHT))
    ];
    const pointer5 = [
      Math.floor(this.r(x)),
      Math.floor(this.r(y + this.HEXHEIGHT))
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

  drawProvinceBorders(originX, originY, cx, cy) {
    const ctx = this.politicalMap.context;
    const x = this.mapState.loc.x + originX;
    const y = this.mapState.loc.y + originY;

    const {
      north, north_east, south_east, south, south_west, north_west
    } = this.getHexSidePoints(x, y);

    const hex = this.grid[cy][cx];

    const foundProvince = this.findProvince(hex);
    if (foundProvince) {
      let offset;

      ctx.lineCap = 'round';
      // north east
      ctx.beginPath();
      offset = this.decideBorderWidth(foundProvince, 'north_east', ctx);
      ctx.moveTo(north[0], north[1] + offset);
      ctx.lineTo(north_east[0] - offset, north_east[1]);
      ctx.stroke();
      ctx.closePath();

      // east
      ctx.beginPath();
      offset = this.decideBorderWidth(foundProvince, 'east', ctx);
      ctx.moveTo(north_east[0] - offset, north_east[1]);
      ctx.lineTo(south_east[0] - offset, south_east[1]);
      ctx.stroke();
      ctx.closePath();

      // south east
      ctx.beginPath();
      offset = this.decideBorderWidth(foundProvince, 'south_east', ctx);
      ctx.moveTo(south_east[0] - offset, south_east[1]);
      ctx.lineTo(south[0], south[1] - offset);
      ctx.stroke();
      ctx.closePath();

      // south west
      ctx.beginPath();
      offset = this.decideBorderWidth(foundProvince, 'south_west', ctx);
      ctx.moveTo(south[0], south[1] - offset);
      ctx.lineTo(south_west[0] + offset, south_west[1]);
      ctx.stroke();
      ctx.closePath();

      // west
      ctx.beginPath();
      offset = this.decideBorderWidth(foundProvince, 'west', ctx);
      ctx.moveTo(south_west[0] + offset, south_west[1]);
      ctx.lineTo(north_west[0] + offset, north_west[1]);
      ctx.stroke();
      ctx.closePath();

      // north west
      ctx.beginPath();
      offset = this.decideBorderWidth(foundProvince, 'north_west', ctx);
      ctx.moveTo(north_west[0] + offset, north_west[1]);
      ctx.lineTo(north[0], north[1] + offset);
      ctx.stroke();
      ctx.closePath();
    }
  }

  updateModel(mapDetails) {
    this.mapDetails = mapDetails;
    this.provinceCache = [];
  }

  findProvince(hex) {
    const hexString = `${hex.x},${hex.y}`;
    if (this.provinceCache[hexString]) {
      return this.provinceCache[hexString];
    }
    let foundProvince;
    _.each(this.mapDetails.provinces, (province) => {
      if (province.hex.x === hex.x && province.hex.y === hex.y) {
        foundProvince = province;
      }
    });
    this.provinceCache[hexString] = foundProvince;
    return foundProvince;
  }

  getHexMidpoint(x, y) {
    return midPoint(_.values(this.getHexSidePoints(x, y)));
  }

  /**
   * Draws a specific hexagon on the world map
   * @param  {Number} x       X coordinate of hex origin
   * @param  {Number} y       Y coordinate of hex origin
   * @param  {Boolean} selected   Whether or not this hex is selected
   * @param  {Number} cx      Hex row
   * @param  {Number} cy      hex col
   */
  drawHexagon(originX, originY, cx, cy) {
    const ctx = this.canvas.context;
    const x = this.mapState.loc.x + originX;
    const y = this.mapState.loc.y + originY;

    if (x < -this.HEXRECTWIDTH || y < -this.HEXRECTHEIGHT) {
      return;
    }

    ctx.lineWidth = 0.3;
    ctx.beginPath();

    const {
      north, north_east, south_east, south, south_west, north_west
    } = this.getHexSidePoints(x, y);

    ctx.moveTo(north[0], north[1]);
    ctx.lineTo(north_east[0], north_east[1]);
    ctx.lineTo(south_east[0], south_east[1]);
    ctx.lineTo(south[0], south[1]);
    ctx.lineTo(south_west[0], south_west[1]);
    ctx.lineTo(north_west[0], north_west[1]);
    ctx.closePath();

    const hex = this.grid[cy][cx];

    let hexColor;
    if (hex) {
      hexColor = hex.colors[this.mapView.map];
    } else {
      hexColor = '0,0,0';
    }
    const foundProvince = this.findProvince(hex);
    if (foundProvince) {
      ctx.fillStyle = foundProvince.owner.display.map_color;
    } else {
      ctx.fillStyle = `rgb(${hexColor})`;
    }

    ctx.fill();
    ctx.stroke();

    const isHovering = this.hover_hex && this.hover_hex === hex;
    const selectedHex = this.functions.getSelectedHex();
    if (isHovering) {
      ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
      ctx.fill();
    } else if (selectedHex && selectedHex.x === hex.x && selectedHex.y === hex.y) {
      ctx.fillStyle = 'rgba(110, 110, 110, 0.4)';
      ctx.fill();
    }

    if (foundProvince && foundProvince.is_capital) {
      const hexMidpoint = this.getHexMidpoint(x, y);
      drawStar(ctx, hexMidpoint[0], hexMidpoint[1], foundProvince.owner.display.border_color, this.r(15), this.r(6));
    }
  }

  /**
   * Draws the edge borders between hexagons
   * @param  {Number} x       X coordinate of hex origin
   * @param  {Number} y       Y coordinate of hex origin
   * @param  {Number} cx      Hex row
   * @param  {Number} cy      hex col
   */
  drawEdges(originX, originY, cx, cy) {
    const ctx = this.canvas.context;
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';

    const view = this.mapView;
    const borderColor = 'rgb(255, 255, 255)';
    const x = this.mapState.loc.x + originX;
    const y = this.mapState.loc.y + originY;

    const {
      north, north_east, south_east, south, south_west, north_west
    } = this.getHexSidePoints(x, y);

    const hex = this.grid[cy][cx];
    if (hex !== null) {
      // var width = settings.border_color_width;


      ctx.beginPath();
      // north east
      if (hex.edges.north_east.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(north[0], north[1]);
        ctx.lineTo(north_east[0], north_east[1]);
      } else if (hex.edges.north_east.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgb(${color.rivers})`;
        ctx.moveTo(north[0], north[1]);
        ctx.lineTo(north_east[0], north_east[1]);
      }

      // east
      if (hex.edges.east.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(north_east[0], north_east[1]);
        ctx.lineTo(south_east[0], south_east[1]);
      } else if (hex.edges.east.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgb(${color.rivers})`;
        ctx.moveTo(north_east[0], north_east[1]);
        ctx.lineTo(south_east[0], south_east[1]);
      }

      // south east
      if (hex.edges.south_east.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(south_east[0], south_east[1]);
        ctx.lineTo(south[0], south[1]);
      } else if (hex.edges.south_east.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgb(${color.rivers})`;
        ctx.moveTo(south_east[0], south_east[1]);
        ctx.lineTo(south[0], south[1]);
      }

      // south west
      if (hex.edges.south_west.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(south[0], south[1]);
        ctx.lineTo(south_west[0], south_west[1]);
      } else if (hex.edges.south_west.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgb(${color.rivers})`;
        ctx.moveTo(south[0], south[1]);
        ctx.lineTo(south_west[0], south_west[1]);
      }

      // west
      if (hex.edges.west.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(south_west[0], south_west[1]);
        ctx.lineTo(north_west[0], north_west[1]);
      } else if (hex.edges.west.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgb(${color.rivers})`;
        ctx.moveTo(south_west[0], south_west[1]);
        ctx.lineTo(north_west[0], north_west[1]);
      }

      // north west
      if (hex.edges.north_west.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(north_west[0], north_west[1]);
        ctx.lineTo(north[0], north[1]);
      } else if (hex.edges.north_west.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgb(${color.rivers})`;
        ctx.moveTo(north_west[0], north_west[1]);
        ctx.lineTo(north[0], north[1]);
      }

      ctx.stroke();
      ctx.closePath();
    }
  }

  /**
   * Changes the map view
   * @param  {View} view   A view to change to
   */
  changeView(view) {
    this.mapView = view;
    this.drawAll();
  }

  clearMap() {
    const rawCanvas = this.canvas.elem[0];
    this.canvas.context.clearRect(0, 0, rawCanvas.width, rawCanvas.height);
    this.politicalMap.context.clearRect(0, 0, rawCanvas.width, rawCanvas.height);
  }

  hexToCoordinate(x, y) {
    return {
      x: y * this.HEXRECTWIDTH + ((x % 2) * this.HEXRADIUS),
      y: x * (this.SIDELENGTH + this.HEXHEIGHT)
    };
  }

  selectHex(hex) {
    const selectedHex = this.functions.getSelectedHex();
    if (selectedHex && selectedHex.x === hex.x && selectedHex.y === hex.y) {
      console.log('deselect');
      this.functions.deselectHex();
    } else {
      console.log('select');
      this.functions.selectHex(hex);
    }
  }

  selectProvince(province, travel) {
    if (province === null) { // deselect
      // this.selected_province = null;
    } else {
      // this.selected_province = province;
      if (travel) {
        const group = _.sortBy(province.groups, 'size').reverse()[0];
        const coord = this.hexToCoordinate(group.x, group.y);
        this.travel(coord.x, coord.y);
      }
    }
  }

  /**
   * Finds the center pixel of the map
   * @return {Object{Number, Number}} X and Y coordinate
   */
  getCenter() {
    return {
      x: (-(this.mapState.loc.x) + (jQuery(window).outerWidth() / 2) * this.mapState.z),
      y: (-(this.mapState.loc.y) + (jQuery(window).outerHeight() / 2) * this.mapState.z)
    };
  }

  /**
   * Zooms the world map
   * @param  {String} direction   up or down
   * @param  {Event} event      jQuery mousewheel event
   */
  zoom(direction, event) {
    const oldzoom = this.mapState.z;
    let x;
    let y;
    if (event) {
      x = event.offsetX;
      y = event.offsetY;
    } else {
      x = this.getCenter().x;
      y = this.getCenter().y;
    }
    if (direction === 'up') {
      this.mapState.z += settings.zoom.interval;
      if (this.mapState.z >= settings.zoom.min) {
        this.mapState.z = settings.zoom.min;
      }
    } else if (direction === 'down') {
      this.mapState.z -= settings.zoom.interval;
      if (this.mapState.z <= settings.zoom.max) {
        this.mapState.z = settings.zoom.max;
      }
    } else {
      this.mapState.z = 1;
      x = this.mapState.cursorX;
      y = this.mapState.cursorY;
    }
    if (oldzoom !== this.mapState.z) {
      this.clearMap();
      this.drawMain();
      this.move(x * this.mapState.z - x * oldzoom, y * this.mapState.z - y * oldzoom);
    }
  }

  /**
   * Moves relatively
   * @param x   X-coord
   * @param y   Y-coord
   */
  move(x, y) {
    this.mapState.loc.x += x;
    this.mapState.loc.y += y;
    this.clearMap();
    this.drawMain();
    this.drawMinimapFrame();
  }

  travel(x2, y2, zoomTo = 1, callback) {
    jQuery({
      ...this.getCenter(), z: this.mapState.z
    }).animate({ x: x2, y: y2, z: zoomTo }, {
      duration: 600,
      easing: 'swing',
      step: () => {
        this.zoom(this.z);
        this.jump(this.x, this.y);
      },
      done() {
        if (_.isDefined(callback)) {
          callback();
        }
      }
    });
  }

  jump(x, y) {
    this.mapState.loc.x = -x + (this.canvas.elem.width() / 2) * this.mapState.z;
    this.mapState.loc.y = -y + (this.canvas.elem.height() / 2) * this.mapState.z;
    this.clearMap();
    this.drawMain();
    this.drawMinimapFrame();
  }
}
