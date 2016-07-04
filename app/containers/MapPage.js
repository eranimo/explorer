import React, { Component, PropTypes } from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import HexGridControl from '../components/map/HexGridControl';
import Header from '../components/nav/Header';

import { loadData } from '../actions/world';
import { fetchNextDay } from '../actions/time';

function mapStateToProps(state) {
  return {
    world: state.world,
    time: state.time
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchNextDay, loadData }, dispatch);
}

class MapPage extends Component {
  static propTypes = {
    world: PropTypes.object.isRequired,
    time: PropTypes.object.isRequired,
    loadData: PropTypes.func.isRequired,
    fetchNextDay: PropTypes.func.isRequired
  };
  componentDidMount() {
    // this.props.loadData();
    // this.props.fetchNextDay();
  }
  render() {
    const { details, timeline, geoforms, hexes, enums } = this.props.world;
    const { dayData } = this.props.time;
    return (
      <div>
        <Header />
        <HexGridControl
          hexes={hexes}
          enums={enums}
          details={details}
          geoforms={geoforms}
          timeline={timeline} />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MapPage);
