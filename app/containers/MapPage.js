import React, { Component, PropTypes } from 'react';

import { connect } from 'react-redux';
import HexGridControl from '../components/map/HexGridControl';
import Header from '../components/nav/Header';


function mapStateToProps(state) {
  return {
    time: state.time
  };
}

class MapPage extends Component {
  static propTypes = {
    time: PropTypes.object.isRequired
  };
  render() {
    const { worldData, timeline } = this.props.time;
    return (
      <div>
        <Header />
        <HexGridControl
          hexes={worldData.hexes}
          enums={worldData.enums}
          details={worldData.details}
          geoforms={[]}
          timeline={timeline}
        />
      </div>
    );
  }
}

export default connect(mapStateToProps)(MapPage);
