import React, { Component, PropTypes } from 'react';
import _ from 'lodash';

class SelectedHex extends Component {
  static propTypes = {
    hex: PropTypes.object
  };

  render() {
    const { hex } = this.props;
    console.log('selected', hex);
    return (
      <div>
        <div>X: {hex.x}</div>
        <div>Y: {hex.y}</div>
        <div>Biome: {hex.biome.title}</div>
        <div>Type: {hex.type}</div>
        <div>Avg Temperature: {hex.temperature} &deg;F</div>
        <div>Moisture Rating: {hex.moisture} units</div>
        <div>Is coastal: {_.some(hex.edges, 'is_coast') ? 'Yes' : 'No'}</div>
        <div>Has river: {_.some(hex.edges, 'is_river') ? 'Yes' : 'No'}</div>
      </div>
    );
  }
}

export default SelectedHex;
