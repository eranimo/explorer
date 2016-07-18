/* eslint-disable camelcase */

import _ from 'lodash';
import jQuery from 'jquery';
import * as MAPVIEWS from './map_views.const';
import { hexToRgb, drawStar, array2D } from 'utils/canvas'; // eslint-disable-line
import HexMap from './HexMap';


const settings = {
  border_color_width: 3,
  zoom: {
    min: 2.0,
    max: 0.2,
    interval: 0.1
  }
};

const color = {
  rivers: '21, 52, 60'
};

const HEX_SIDES = {
  north_east: { fromPoint: 'north', toPoint: 'north_east' },
  east: { fromPoint: 'north_east', toPoint: 'south_east' },
  south_east: { fromPoint: 'south_east', toPoint: 'south' },
  south_west: { fromPoint: 'south', toPoint: 'south_west' },
  west: { fromPoint: 'south_west', toPoint: 'north_west' },
  north_west: { fromPoint: 'north_west', toPoint: 'north' },
};


export default class WorldMap extends HexMap {

  provinceCache = {};
  hexPointsCache = {};

  constructor(hexes, canvases, mapView, currentDay, functions, mapDetails) {
    super(hexes);
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
    this.country_borders = {};

    this.pointOffset = this.r(10);
    this.hexPointInner = {
      north: [
        0, this.pointOffset
      ],
      north_east: [
        -Math.cos(this.HEXAGONANGLE) * this.pointOffset,
        Math.tan(this.HEXAGONANGLE) * (Math.cos(this.HEXAGONANGLE) * this.pointOffset)
      ],
      south_east: [
        -Math.cos(this.HEXAGONANGLE) * this.pointOffset,
        -Math.tan(this.HEXAGONANGLE) * (Math.cos(this.HEXAGONANGLE) * this.pointOffset)
      ],
      south: [
        0, -this.pointOffset
      ],
      south_west: [
        Math.cos(this.HEXAGONANGLE) * this.pointOffset,
        -Math.tan(this.HEXAGONANGLE) * (Math.cos(this.HEXAGONANGLE) * this.pointOffset)
      ],
      north_west: [
        Math.cos(this.HEXAGONANGLE) * this.pointOffset,
        Math.tan(this.HEXAGONANGLE) * (Math.cos(this.HEXAGONANGLE) * this.pointOffset)
      ]
    };

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
        if (this.hover_hex && difference < 300) {
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

    for (const { hex, cx, cy } of this.allHexes()) {
      const foundProvince = this.findProvince(hex);
      if (foundProvince) {
        const pcolor = hexToRgb(foundProvince.owner.display.map_color);
        drawPixel(cy, cx, pcolor.r, pcolor.g, pcolor.b, 255);
      } else {
        const pcolor = hex.colors[this.mapView.map];
        drawPixel(cy, cx, pcolor[0], pcolor[1], pcolor[2], 255);
      }
    }
    this.drawMinimapFrame();
    mctx.putImageData(canvasData, 0, 0);
  }

  // draw minimap frame which shows you where you are
  drawMinimapFrame() {
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

  // draw international borders
  drawCountryBorders() {
    // build a mapping of countries to their borders and which hexes they're at
    // TODO: This doesn't need to happen each draw
    _.mapValues(this.mapDetails.countries, (country) => {
      this.country_borders[country.id] = {
        north_east: [],
        east: [],
        south_east: [],
        south_west: [],
        west: [],
        north_west: []
      };
    });

    for (const { hex } of this.allVisibleHexes()) {
      const province = this.findProvince(hex);
      if (province) {
        // console.log(hex);
        const ownerId = province.owner.id;
        const neighbors = this.getHexNeighbors(hex.x, hex.y);
        _.each(HEX_SIDES, ({ fromPoint, toPoint }, sideName) => {
          const foundHex = neighbors[sideName];
          const foundProvince = this.findProvince(foundHex);
          // console.log(hex.x, hex.y, sideName, foundProvince)
          if (!foundProvince) {
            // border with wilderness
            this.country_borders[ownerId][sideName].push(hex);
          } else if (foundProvince.owner.id !== ownerId) {
            // border with foreign province
            this.country_borders[ownerId][sideName].push(hex);
          }
        });
      }
    }

    const ctx = this.canvas.context;
    ctx.lineCap = 'miter'; // 'round';
    ctx.lineWidth = this.r(2);

    // for each country...
    _.values(this.mapDetails.countries).forEach((country) => {
      ctx.beginPath();

      // for each HexSide...
      _.each(this.country_borders[country.id], (sides, sideName) => {
        const { fromPoint, toPoint } = HEX_SIDES[sideName];

        // draw borders for this side at these hexes
        sides.forEach((hex) => {
          // console.log(`Drawing side ${sideName} for ${hex.x}, ${hex.y}`);
          const coordinate = this.hexToCoordinate(hex.x, hex.y);
          const x = this.mapState.loc.x + coordinate.x;
          const y = this.mapState.loc.y + coordinate.y;
          const points = this.getHexSidePoints(x, y);
          ctx.strokeStyle = country.display.border_color;
          ctx.moveTo(
            points[fromPoint][0] + this.hexPointInner[fromPoint][0],
            points[fromPoint][1] + this.hexPointInner[fromPoint][1]
          );
          ctx.lineTo(
            points[toPoint][0] + this.hexPointInner[toPoint][0],
            points[toPoint][1] + this.hexPointInner[toPoint][1]
          );
          // console.log(points[fromPoint][0] - 1, points[fromPoint][1]);
          // console.log(points[toPoint][0] - 1, points[toPoint][1]);
        });
      });
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.closePath();
    });
  }

  // draw selected hex
  drawSelectedHex() {
    const ctx = this.canvas.context;
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
      if (this.mapState.z < 0.4) {
        ctx.lineWidth = this.r(2);
      } else {
        ctx.lineWidth = this.r(3);
      }
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
  }

  // draw country names over their center points
  drawCountryNames() {
    const ctx = this.canvas.context;
    ctx.font = '20pt Arial';
    ctx.textAlign = 'center';

    // draw countries
    _.mapValues(this.mapDetails.countries, (country) => {
      country.groups.forEach(({ x_coord, y_coord }) => {
        let { x, y } = this.hexToCoordinate(x_coord, y_coord);

        x = this.r(Math.round(this.mapState.loc.x + x));
        y = this.r(Math.round(this.mapState.loc.y + y));

        ctx.fillStyle = '#DDD'; // country.display.border_color;
        ctx.fillText(country.name, x - 1, y - 1);
      });
    });
  }

  // draw tooltips over hexes
  drawHexTooltip() {
    const ctx = this.canvas.context;
    if (this.hover_hex) {
      const foundProvince = this.findProvince(this.hover_hex);
      if (foundProvince) {
        let { x, y } = this.hexToCoordinate(this.hover_hex.x, this.hover_hex.y);
        x = Math.round(this.r(Math.round(this.mapState.loc.x + x)));
        y = Math.round(this.r(Math.round(this.mapState.loc.y + y)));

        const textSize = ctx.measureText(foundProvince.name);
        const width = Math.round(textSize.width - (textSize.width * 0.35));
        ctx.beginPath();
        ctx.fillStyle = 'rgb(50, 50, 50)';
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        ctx.rect(x + this.r(this.HEXRECTWIDTH) / 2 - width / 2, y - 15, width, 22);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.font = '14px Arial';
        ctx.fillStyle = '#DDD';
        ctx.textAlign = 'center';
        ctx.fillText(foundProvince.name, x + this.r(this.HEXRECTWIDTH) / 2 + 0.5, y + 0.5);
      }
    }
  }


  /**
   * Draws the main world map
   */
  drawMain() {
    for (const props of this.allVisibleHexes()) {
      this.drawHexagon(props);
    }

    this.drawCountryBorders();

    if (this.mapView.rivers || this.mapView.borders) {
      for (const props of this.allVisibleHexes()) {
        this.drawEdges(props);
      }
    }

    this.drawSelectedHex();
    this.drawCountryNames();
    this.drawHexTooltip();
  }

  // TODO: remove
  decideBorderWidth(province, side, ctx) {
    ctx.lineWidth = this.r(1);
    ctx.strokeStyle = province.owner.display.border_color;
    return 0;
    //
    // const neighbors = this.getHexNeighbors(province.hex.x, province.hex.y);
    // const ownerId = province.owner.id;
    // const foundProvince = this.findProvince(neighbors[side]);
    //
    // // border with wilderness
    // if (!foundProvince) {
    //   ctx.lineWidth = this.r(1);
    //   ctx.strokeStyle = province.owner.display.border_color;
    //   return 2;
    // }
    //
    // // border with owned province
    // if (foundProvince.owner.id === ownerId) {
    //   ctx.lineWidth = 1;
    //   ctx.strokeStyle = province.owner.display.border_color;
    //   return 0;
    // }
    //
    // // border with foreigh province
    // ctx.lineWidth = this.r(3);
    // ctx.strokeStyle = province.owner.display.border_color;
    // return 3;
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

  /**
   * Draws a specific hexagon on the world map
   * @param  {Number} x       X coordinate of hex origin
   * @param  {Number} y       Y coordinate of hex origin
   * @param  {Boolean} selected   Whether or not this hex is selected
   * @param  {Number} cx      Hex row
   * @param  {Number} cy      hex col
   */
  drawHexagon({ originX, originY, hex, cx, cy }) {
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

    let hexColor;
    if (hex) {
      hexColor = hex.colors[this.mapView.map];
    } else {
      console.warn(`Hex not found for ${cx}, ${cy}`);
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
      const hexMidpoint = this.getHexMidpoint(hex);
      let starInner;
      let starOuter;
      if (this.mapState.z >= 0.4) {
        starInner = this.r(4);
        starOuter = this.r(10);
      } else {
        starInner = this.r(2);
        starOuter = this.r(6);
      }
      drawStar(ctx, hexMidpoint[0], hexMidpoint[1], foundProvince.owner.display.border_color, starOuter, starInner);
    }

    if (foundProvince && this.mapState.z < 0.4) {
      // draw name plate
      const midpoint = this.getHexMidpoint(hex);
      // x = Math.round(this.r(Math.round(this.mapState.loc.x + x)));
      // y = Math.round(this.r(Math.round(this.mapState.loc.y + y)));
      ctx.fillStyle = foundProvince.owner.display.border_color;
      ctx.font = `${this.r(5)}px Arial`;
      ctx.fillText(foundProvince.name, midpoint[0] + 0.5, midpoint[1] - this.r(this.HEXHEIGHT) + 0.5);
    }
  }

  /**
   * Draws the edge borders between hexagons
   * @param  {Number} x       X coordinate of hex origin
   * @param  {Number} y       Y coordinate of hex origin
   * @param  {Number} cx      Hex row
   * @param  {Number} cy      hex col
   */
  drawEdges({ originX, originY, hex }) {
    const ctx = this.canvas.context;
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';

    const view = this.mapView;
    const borderColor = 'rgb(50, 50, 50)';
    const x = this.mapState.loc.x + originX;
    const y = this.mapState.loc.y + originY;

    const {
      north, north_east, south_east, south, south_west, north_west
    } = this.getHexSidePoints(x, y);

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
        ctx.lineWidth = this.r(2.5);
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
        ctx.lineWidth = this.r(2.5);
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
        ctx.lineWidth = this.r(2.5);
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
        ctx.lineWidth = this.r(2.5);
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
        ctx.lineWidth = this.r(2.5);
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
        ctx.lineWidth = this.r(2.5);
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
