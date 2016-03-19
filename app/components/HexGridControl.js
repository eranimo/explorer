import React, { Component, PropTypes } from 'react';
import styles from './HexGrid.module.css';
import _ from 'lodash';
import * as MAPVIEWS from './map_views.const';

import HexGrid from './HexGrid';
import SelectedHex from './SelectedHex';


const Divider = function (){
  return <div className={styles.divider}></div>
}

class HexGridControl extends Component {
  static propTypes = {
    hexes: PropTypes.array,
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
    console.log(hex);
    this.setState({
      selectedHex: hex
    });
  }

  deselectHex() {
    console.log('deselect hex')
    this.setState({
      selectedHex: null
    });
  }

  getSelectedHex() {
    return this.state.selectedHex;
  }

  render() {
    const { hexes, details, geoforms } = this.props;
    if (hexes) {
      const mapViews = _.toArray(MAPVIEWS).map((v) => {
        return (<option key={v.name} value={v.map}>{v.title}</option>);
      });
      let selectedHex = null;
      if (this.state.selectedHex) {
        selectedHex = (
          <div className={styles.sidebar}>
            <SelectedHex hex={this.state.selectedHex}
              geoforms={geoforms}
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

            <label className={styles.control}>
              <span>Play</span>
              <button type="button">
                <i className="fa fa-play"></i>
              </button>
            </label>

            <Divider />

            <label className={styles.control}>
              <span>Last Day</span>
              <button type="button">
                <i className="fa fa-arrow-left"></i>
              </button>
            </label>

            <label className={styles.control}>
              <span>Current Day:</span>
              <div>January 1, 0001</div>
            </label>

            <label className={styles.control}>
              <span>Next Day</span>
              <button type="button">
                <i className="fa fa-arrow-right"></i>
              </button>
            </label>

            <Divider />

            <label className={styles.control}>
              <span>Slower</span>
              <button type="button">
                <i className="fa fa-backward"></i>
              </button>
            </label>

            <label className={styles.control}>
              <span>Speed:</span>
              <div>0</div>
            </label>

            <label className={styles.control}>
              <span>Faster</span>
              <button type="button">
                <i className="fa fa-forward"></i>
              </button>
            </label>

            <Divider />

          </div>
          {selectedHex}
          <HexGrid hexes={hexes}
            details={details}
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
