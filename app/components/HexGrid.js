import React, { Component, PropTypes } from 'react';
import styles from './HexGrid.module.css';
import _ from 'lodash';
import jQuery from 'jquery';

import * as MAPVIEWS from './map_views.const';

var settings = {
  border_color_width: 3,
  zoom: {
    min: 2.0,
    max: 0.5,
    interval: 0.1
  }
};

var color = {
  rivers: '21, 52, 60'
};

function darken(_color, percent) {
  let color = _color.split(',');
  _.map(color, (c) => parseInt(c, 10));
  color[0] = color[0] - (color[0] * (percent/100));
  color[1] = color[1] - (color[1] * (percent/100));
  color[2] = color[2] - (color[2] * (percent/100));
  var r = Math.round(Math.max(Math.min(color[0], 255), 0));
  var g = Math.round(Math.max(Math.min(color[1], 255), 0));
  var b = Math.round(Math.max(Math.min(color[2], 255), 0));
  return r + ',' + g + ',' + b;
}

class WorldMap {

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

  constructor(hexes, mainCanvas, minimapCanvas, frameCanvas, mapView, functions) {
    this.size = hexes.length;
    this.setMapView(mapView);
    this.functions = functions;
    this.canvas = {
      elem: jQuery(mainCanvas),
      context: mainCanvas.getContext('2d')
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
        width: this.anchor.width(),
        height: jQuery(window).height() - this.anchor.height()
      });

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
          this.drawProvinces();
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
        // draw hexagon hovering
        // var screenX, screenY;

        this.mapState.cursorX = e.offsetX;
        this.mapState.cursorY = e.offsetY;

        var coord = this.screenToCoordinate(e.offsetX, e.offsetY);
        var hexPos = this.coordinateToHex(coord.x, coord.y);

        this.mapState.selecting = true;

        // screenX = hexPos.x * this.HEXRECTWIDTH + ((hexPos.y % 2) * this.HEXRADIUS);
        // screenY = hexPos.y * (this.HEXHEIGHT + this.SIDELENGTH);

        this.clearMap();


        // Check if the mouse's coords are on the board
        if (hexPos !== null && hexPos.x >= 0 && hexPos.x < this.BOARDWIDTH) {
          if (hexPos.y >= 0 && hexPos.y < this.BOARDHEIGHT) {
            var hex = this.grid[hexPos.y][hexPos.x];
            this.hover_hex = hex;
            // if (hex.province_id) { // has provicne (i.e. not water)
            //   this.hover_province_id = hex.province_id;
            //   this.canvas.elem.css('cursor', 'pointer');
            //   //this.drawHexagon(screenX, screenY, true, hexPos.x, hexPos.y);
            // } else {
            //   this.hover_province_id = null;
            //   this.canvas.elem.css('cursor', 'default');
            // }
          }
        }

        if (hexPos === null) {
          this.hover_hex = null;
        }
        this.drawMain();
        this.drawMinimapFrame();
        this.drawProvinces();
      },
      mousewheel: (e) => {
        var delta = e.originalEvent.wheelDelta;
        if (delta < 0) {
          // up
          this.zoom('up', e);
        } else if (delta > 0) {
          // down
          this.zoom('down', e);
        }
        this.drawProvinces();
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
    jQuery(window).on({
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
          this.drawProvinces();
        } else if (code === 67) {
          console.log(this.getCenter());
        }
      },
      resize: () => {
        this.resize();
      }
    });
    this.resize();
  }

  setMapView(mapView) {
    this.mapView = MAPVIEWS[mapView];
  }

  /**
   * Gets the coordinates of the top left and bottom right visible hex
   * @return {Object{x1, y1, x2, y2}}   Coordinates Object
   */
  getVisibleHexes() {
    const topLeft = this.screenToCoordinate(0, 0);
    const bottomRight = this.screenToCoordinate(this.getWidth(), this.getHeight());
    var one = this.coordinateToHex(topLeft.x, topLeft.y, true);
    var two = this.coordinateToHex(bottomRight.x, bottomRight.y, true);
    var offset = Math.round(7 / this.mapState.z);
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

  pointInTriangle(p, p0, p1, p2) {
    var A = 1 / 2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    var sign = A < 0 ? -1 : 1;
    var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
    var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

    return s > 0 && t > 0 && (s + t) < 2 * A * sign;
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
      if (ySectionPixel < (h - xSectionPixel * m)) {// left Edge
        ArrayY = ySection - 1;
        ArrayX = xSection - 1;
      } else if (ySectionPixel < (-h + xSectionPixel * m)) {// right Edge
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
    var canvas = this.canvas.elem;
    canvas
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
    this.drawMain();
    this.drawMinimap();
    this.drawProvinces();
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
    let canvas = this.minimapCanvas.elem[0];
    canvas.width = 200;
    canvas.height = 200;
    let mctx = this.minimapCanvas.context;
    mctx.mozImageSmoothingEnabled = false;
    mctx.webkitImageSmoothingEnabled = false;
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

    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';
    mctx.scale(ratio, ratio);

    var canvasData = mctx.getImageData(0, 0, size, size);

    function drawPixel(x, y, r, g, b, a) {
      var index = (x + y * size) * 4;

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
        var cell = this.grid[j][i];
        if (cell) {
          var color;
          if (this.mapView.colors) {
            // if (cell.province_color) {
            //   color = cell.province_color.split(',');
            // } else {
            color = cell.colors[this.mapView.map];
            // }
          } else {
            color = cell.colors[this.mapView.map];
          }
          drawPixel(i, j, color[0], color[1], color[2], 255);
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
    var ctx = this.canvas.context;
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 10;
    ctx.strokeWidth = 10;

    var visible = this.getVisibleHexes();
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

    // draw selected hexagon

    // var selected_hex = this.scope.vm.selected_hex;
    // if (selected_hex) {
    //   var x = this.mapState.loc.x + selected_hex.y * this.HEXRECTWIDTH + ((selected_hex.x % 2) * this.HEXRADIUS),
    //     y = this.mapState.loc.y + selected_hex.x * (this.SIDELENGTH + this.HEXHEIGHT),
    //     origin = [this.r(x + this.HEXRADIUS), this.r(y)],
    //     pointer_1 = [this.r(x) + this.r(this.HEXRECTWIDTH), this.r(y + this.HEXHEIGHT)],
    //     pointer_2 = [this.r(x) + this.r(this.HEXRECTWIDTH), this.r(y + this.HEXHEIGHT + this.SIDELENGTH)],
    //     pointer_3 = [this.r(x) + this.r(this.HEXRADIUS), this.r(y + this.HEXRECTHEIGHT)],
    //     pointer_4 = [this.r(x), this.r(y + this.SIDELENGTH + this.HEXHEIGHT)],
    //     pointer_5 = [this.r(x), this.r(y + this.HEXHEIGHT)];
    //
    //   ctx.lineWidth = 2;
    //   ctx.beginPath();
    //
    //   // north east
    //   ctx.strokeStyle = 'rgb(255, 246, 15);';
    //   ctx.moveTo(origin[0], origin[1] + 1);
    //   ctx.lineTo(pointer_1[0] - 1, pointer_1[1]);
    //
    //   // east
    //   ctx.moveTo(pointer_1[0] - 1, pointer_1[1]);
    //   ctx.lineTo(pointer_2[0] - 1, pointer_2[1]);
    //
    //   // south east
    //   ctx.moveTo(pointer_2[0] - 1, pointer_2[1]);
    //   ctx.lineTo(pointer_3[0], pointer_3[1] - 1);
    //
    //   // south west
    //   ctx.moveTo(pointer_3[0], pointer_3[1] - 1);
    //   ctx.lineTo(pointer_4[0] + 1, pointer_4[1]);
    //
    //   // west
    //   ctx.moveTo(pointer_4[0] + 1, pointer_4[1]);
    //   ctx.lineTo(pointer_5[0] + 1, pointer_5[1]);
    //
    //   // north west
    //   ctx.moveTo(pointer_5[0] + 1, pointer_5[1]);
    //   ctx.lineTo(origin[0], origin[1] + 1);
    //
    //   ctx.stroke();
    //   ctx.closePath();
    // }
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
    var ctx = this.canvas.context;
    const x = this.mapState.loc.x + originX;
    const y = this.mapState.loc.y + originY;
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    const origin = [this.r(x + this.HEXRADIUS), this.r(y)];
    const pointer1 = [this.r(x) + this.r(this.HEXRECTWIDTH), this.r(y + this.HEXHEIGHT)];
    const pointer2 = [this.r(x) + this.r(this.HEXRECTWIDTH), this.r(y + this.HEXHEIGHT + this.SIDELENGTH)];
    const pointer3 = [this.r(x) + this.r(this.HEXRADIUS), this.r(y + this.HEXRECTHEIGHT)];
    const pointer4 = [this.r(x), this.r(y + this.SIDELENGTH + this.HEXHEIGHT)];
    const pointer5 = [this.r(x), this.r(y + this.HEXHEIGHT)];
    ctx.moveTo(origin[0], origin[1]);
    ctx.lineTo(pointer1[0], pointer1[1]);
    ctx.lineTo(pointer2[0], pointer2[1]);
    ctx.lineTo(pointer3[0], pointer3[1]);
    ctx.lineTo(pointer4[0], pointer4[1]);
    ctx.lineTo(pointer5[0], pointer5[1]);
    ctx.closePath();

    var hex = this.grid[cy][cx];
    let color;
    if (hex) {
      color = hex.colors[this.mapView.map];
      color = color.join(',');
    } else {
      color = '0,0,0';
    }
    ctx.fillStyle = 'rgb(' + color + ')';
    ctx.fill();
    ctx.stroke();
    const isHovering = this.hover_hex && this.hover_hex === hex;
    const selectedHex = this.functions.getSelectedHex();
    if (isHovering) {
      ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
      ctx.fill();
    } else if (selectedHex && selectedHex.id === hex.id) {
      ctx.fillStyle = 'rgba(110, 110, 110, 0.4)';
      ctx.fill();
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
    const view = this.mapView;
    const borderColor = 'rgb(255, 255, 255)';
    const x = this.mapState.loc.x + originX;
    const y = this.mapState.loc.y + originY;

    let origin = [this.r(x + this.HEXRADIUS), this.r(y)];
    let pointer_1 = [this.r(x) + this.r(this.HEXRECTWIDTH), this.r(y + this.HEXHEIGHT)];
    let pointer_2 = [this.r(x) + this.r(this.HEXRECTWIDTH), this.r(y + this.HEXHEIGHT + this.SIDELENGTH)];
    let pointer_3 = [this.r(x) + this.r(this.HEXRADIUS), this.r(y + this.HEXRECTHEIGHT)];
    let pointer_4 = [this.r(x), this.r(y + this.SIDELENGTH + this.HEXHEIGHT)];
    let pointer_5 = [this.r(x), this.r(y + this.HEXHEIGHT)];
    var hex = this.grid[cy][cx];
    if (hex !== null) {
      // var width = settings.border_color_width;

      // if (hex.province_color && view.borders) {
      //   ctx.beginPath();
      //   ctx.lineCap = 'round';
      //   ctx.lineWidth = (settings.border_color_width + 1.5) / this.mapState.z;
      //   ctx.strokeStyle = 'rgb(' + darken(hex.province_color, 30) + ')';
      //   if (hex.border_north_east) {
      //     ctx.moveTo(origin[0], origin[1] + width);
      //     ctx.lineTo(pointer_1[0] - width, pointer_1[1]);
      //   }
      //   if (hex.border_east) {
      //     ctx.moveTo(pointer_1[0] - width, pointer_1[1]);
      //     ctx.lineTo(pointer_2[0] - width, pointer_2[1]);
      //   }
      //   if (hex.border_south_east) {
      //     ctx.moveTo(pointer_2[0] - width, pointer_2[1]);
      //     ctx.lineTo(pointer_3[0], pointer_3[1] - width);
      //   }
      //   if (hex.border_south_west) {
      //     ctx.moveTo(pointer_3[0], pointer_3[1] - width);
      //     ctx.lineTo(pointer_4[0] + width, pointer_4[1]);
      //   }
      //   if (hex.border_west) {
      //     ctx.moveTo(pointer_4[0] + width, pointer_4[1]);
      //     ctx.lineTo(pointer_5[0] + width, pointer_5[1]);
      //   }
      //   if (hex.border_north_west) {
      //     ctx.moveTo(pointer_5[0] + width, pointer_5[1]);
      //     ctx.lineTo(origin[0], origin[1] + width);
      //   }
      //   ctx.stroke();
      //   ctx.closePath();
      // }
      const selectedHex = this.functions.getSelectedHex();
      if (selectedHex && selectedHex.id === hex.id) {
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        const width = 1;
        ctx.moveTo(origin[0], origin[1] + width);
        ctx.lineTo(pointer_1[0] - width, pointer_1[1]);
        ctx.moveTo(pointer_1[0] - width, pointer_1[1]);
        ctx.lineTo(pointer_2[0] - width, pointer_2[1]);
        ctx.moveTo(pointer_2[0] - width, pointer_2[1]);
        ctx.lineTo(pointer_3[0], pointer_3[1] - width);
        ctx.moveTo(pointer_3[0], pointer_3[1] - width);
        ctx.lineTo(pointer_4[0] + width, pointer_4[1]);
        ctx.moveTo(pointer_4[0] + width, pointer_4[1]);
        ctx.lineTo(pointer_5[0] + width, pointer_5[1]);
        ctx.moveTo(pointer_5[0] + width, pointer_5[1]);
        ctx.lineTo(origin[0], origin[1] + width);
        ctx.stroke();
        ctx.closePath();
      }
      ctx.beginPath();
      ctx.setLineDash([0, 0]);
      // north east
      if (hex.edges.north_east.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(origin[0], origin[1]);
        ctx.lineTo(pointer_1[0], pointer_1[1]);
      } else if (hex.edges.north_east.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgb(" + color.rivers +')';
        ctx.moveTo(origin[0], origin[1]);
        ctx.lineTo(pointer_1[0], pointer_1[1]);
      }

      // east
      if (hex.edges.east.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(pointer_1[0], pointer_1[1]);
        ctx.lineTo(pointer_2[0], pointer_2[1]);
      } else if (hex.edges.east.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgb(" + color.rivers +')';
        ctx.moveTo(pointer_1[0], pointer_1[1]);
        ctx.lineTo(pointer_2[0], pointer_2[1]);
      }

      // south east
      if (hex.edges.south_east.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(pointer_2[0], pointer_2[1]);
        ctx.lineTo(pointer_3[0], pointer_3[1]);
      } else if (hex.edges.south_east.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgb(" + color.rivers +')';
        ctx.moveTo(pointer_2[0], pointer_2[1]);
        ctx.lineTo(pointer_3[0], pointer_3[1]);
      }

      // south west
      if (hex.edges.south_west.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(pointer_3[0], pointer_3[1]);
        ctx.lineTo(pointer_4[0], pointer_4[1]);
      } else if (hex.edges.south_west.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgb(" + color.rivers +')';
        ctx.moveTo(pointer_3[0], pointer_3[1]);
        ctx.lineTo(pointer_4[0], pointer_4[1]);
      }

      // west
      if (hex.edges.west.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(pointer_4[0], pointer_4[1]);
        ctx.lineTo(pointer_5[0], pointer_5[1]);
      } else if (hex.edges.west.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgb(" + color.rivers +')';
        ctx.moveTo(pointer_4[0], pointer_4[1]);
        ctx.lineTo(pointer_5[0], pointer_5[1]);
      }

      // north west
      if (hex.edges.north_west.is_coast && view.borders) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.moveTo(pointer_5[0], pointer_5[1]);
        ctx.lineTo(origin[0], origin[1]);
      } else if (hex.edges.north_west.is_river && view.rivers) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgb(" + color.rivers +')';
        ctx.moveTo(pointer_5[0], pointer_5[1]);
        ctx.lineTo(origin[0], origin[1]);
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
  }

  /**
   * Draws Province's names above their territories
   * @param  {[]} ctx [description]
   */
  drawProvinces() {
    // let ctx = this.canvas.context;
    // if (this.mapView.territories) {
    //   if (this.colony.provinces.length > 0) {
    //     this.colony.provinces.forEach((p) => {
    //       p.groups.forEach((g) => {
    //         if (g.size > 3) {
    //           ctx.fillStyle = '#000';
    //           ctx.font = '24pt Arial';
    //           ctx.textAlign = 'center';
    //           var x = this.mapState.loc.y + (g.x * (this.SIDELENGTH + this.HEXHEIGHT) + this.SIDELENGTH),
    //             y = this.mapState.loc.x + (g.y * this.HEXRECTWIDTH + ((g.x % 2) * this.HEXRADIUS) + this.SIDELENGTH);
    //           ctx.fillText(p.name, this.r(y), this.r(x));
    //           if (this.selected_province && this.selected_province === p) {
    //             ctx.fillStyle = '#3073a9';
    //           } else {
    //             ctx.fillStyle = '#FFF';
    //           }
    //           ctx.fillText(p.name, this.r(y - 2), this.r(x - 2));
    //         }
    //       });
    //     });
    //   }
    // }
  }

  hexToCoordinate(x, y) {
    return {
      x:  y * this.HEXRECTWIDTH + ((x % 2) * this.HEXRADIUS),
      y:  x * (this.SIDELENGTH + this.HEXHEIGHT)
    };
  }

  selectHex(hex) {
    const selectedHex = this.functions.getSelectedHex();
    if (selectedHex && selectedHex.id === hex.id) {
      console.log('deselect');
      this.functions.deselectHex();
    } else {
      console.log('select');
      this.functions.selectHex(hex);
    }
  }

  selectProvince(province, travel) {
    if (province === null) { // deselect
      //this.selected_province = null;
    } else {
      //this.selected_province = province;
      if (travel) {
        const group = _.sortBy(province.groups, 'size').reverse()[0];
        const coord = this.hexToCoordinate(group.x, group.y);
        this.travel(coord.x, coord.y);
      }
      this.drawProvinces();
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
      this.drawProvinces();
      var m_x = (x * this.mapState.z - x * oldzoom) / 1,
        m_y = (y * this.mapState.z - y * oldzoom) / 1;
      this.move(m_x, m_y);
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
    this.drawProvinces();
    this.drawMinimapFrame();
  }

  travel(x2, y2, zoomTo = 1, callback) {
    var self = this,
      x = this.getCenter().x,
      y = this.getCenter().y,
      zoom = this.mapState.z;
    jQuery({ x: x, y: y, z: zoom }).animate({ x: x2, y: y2, z: zoomTo }, {
      duration: 600,
      easing: 'swing',
      step() {
        self.zoom(this.z);
        self.jump(this.x, this.y);
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
    this.drawProvinces();
    this.drawMinimapFrame();
  }
}

class HexGrid extends Component {
  static propTypes = {
    mapView: PropTypes.string,
    hexes: PropTypes.array,
    details: PropTypes.object,
    selectHex: PropTypes.func,
    deselectHex: PropTypes.func,
    getSelectedHex: PropTypes.func
  };

  componentDidMount() {
    const { hexes, mapView, selectHex, deselectHex, getSelectedHex } = this.props;
    const hexmap = this.refs.hexmap;
    const minimapImage = this.refs.minimapImage;
    const minimapFrame = this.refs.minimapFrame;
    this.worldMap = new WorldMap(hexes, hexmap, minimapImage, minimapFrame, mapView, {
      selectHex,
      deselectHex,
      getSelectedHex
    });
  }

  componentDidUpdate() {
    this.worldMap.setMapView(this.props.mapView);
    this.worldMap.drawAll();
  }

  render() {
    return (
      <div>
        <canvas ref="hexmap" className={styles.hexmap}></canvas>
        <div id="minimap" className={styles.minimap}>
            <canvas ref="minimapImage" className={styles.minimapPart} width="200" height="200"></canvas>
            <canvas ref="minimapFrame" className={styles.minimapPart} width="200" height="200"></canvas>
        </div>
      </div>
    );
  }
}

export default HexGrid;
