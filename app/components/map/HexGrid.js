import React, { Component, PropTypes } from 'react';
import styles from './HexGrid.module.scss';
import _ from 'lodash';

import WorldMap from './WorldMap';

class HexGrid extends Component {
  static propTypes = {
    mapView: PropTypes.string,
    hexes: PropTypes.array,
    details: PropTypes.object,
    dayData: PropTypes.dayData,
    selectHex: PropTypes.func,
    deselectHex: PropTypes.func,
    getSelectedHex: PropTypes.func
  };

  componentDidMount() {
    const { hexes, mapView, selectHex, deselectHex, getSelectedHex, dayData } = this.props;
    const canvases = {
      mainCanvas: this.refs.hexmap,
      politicalMap: this.refs.politicalMap,
      minimapCanvas: this.refs.minimapImage,
      frameCanvas: this.refs.minimapFrame
    };
    this.worldMap = new WorldMap(hexes, canvases, mapView, dayData, {
      selectHex,
      deselectHex,
      getSelectedHex
    }, this.getMapDetails());
  }

  componentDidUpdate() {
    this.worldMap.updateModel(this.getMapDetails());
    this.worldMap.setMapView(this.props.mapView);
    this.worldMap.drawAll();
  }

  getMapDetails() {
    const provinces = _.flatten(_.map(this.props.dayData.Country, (c) => c.provinces));
    const countries = _.mapValues(this.props.dayData.Country);
    return { provinces, countries };
  }

  render() {
    return (
      <div>
        <canvas ref="hexmap" className={styles.hexmap}></canvas>
        <canvas ref="politicalMap" className={styles.politicalMap}></canvas>
        <div id="minimap" className={styles.minimap}>
            <canvas ref="minimapImage" className={styles.minimapPart} width="200" height="200"></canvas>
            <canvas ref="minimapFrame" className={styles.minimapPart} width="200" height="200"></canvas>
        </div>
      </div>
    );
  }
}

export default HexGrid;
