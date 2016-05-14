import React, { Component, PropTypes } from 'react';
import styles from './HexGrid.module.scss';
import _ from 'lodash';
import * as MAPVIEWS from './map_views.const';

import HexGrid from './HexGrid';
import SelectedHex from './SelectedHex';


const Divider = function Divider() {
  return <div className={styles.divider}></div>
};

class HexGridControl extends Component {
  static propTypes = {
    hexes: PropTypes.array,
    enums: PropTypes.object,
    dayData: PropTypes.object,
    timeline: PropTypes.object,
    geoforms: PropTypes.array,
    details: PropTypes.object,
  };

  state = {
    mapView: 'satellite',
    selectedHex: null
  };

  updateMapView(event) {
    this.setState({
      mapView: event.target.value
    });
  }

  selectHex(hex) {
    console.log('Select', hex);
    this.setState({
      selectedHex: hex
    });
  }

  selectHexByCoordinate(x, y){
    console.log('Select', this.props.hexes[x][y])
    this.setState({
      selectedHex: this.props.hexes[x][y]
    })
  }

  deselectHex() {
    console.log('Deselect hex')
    this.setState({
      selectedHex: null
    });
  }

  getSelectedHex() {
    return this.state.selectedHex;
  }

  render() {
    const { hexes, details, geoforms, dayData, timeline, enums } = this.props;
    if (hexes) {
      const mapViews = _.toArray(MAPVIEWS).map((v) => {
        return (<option key={v.name} value={v.map}>{v.title}</option>);
      });
      let selectedHex = null;
      if (this.state.selectedHex) {
        selectedHex = (
          <div className={styles.sidebar}>
            <SelectedHex
              hex={this.state.selectedHex}
              select={this.selectHexByCoordinate.bind(this)}
              deselect={this.deselectHex.bind(this)}
            />
          </div>
        );
      }
      return (
        <div>
          <div className={styles.controls}>
            <label className={styles.control}>
              <span>Map View:</span>
              <select onChange={this.updateMapView.bind(this)}>
                {mapViews}
              </select>
            </label>

            <Divider />
          </div>
          {selectedHex}
          <HexGrid
            mapView={this.state.mapView}
            selectHex={this.selectHex.bind(this)}
            deselectHex={this.deselectHex.bind(this)}
            getSelectedHex={this.getSelectedHex.bind(this)}
          />
        </div>
      );
    }
    return (<span>Loading...</span>);
  }
}

export default HexGridControl;
