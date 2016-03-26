import React, { Component, PropTypes } from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import HexGridControl from '../components/map/HexGridControl';
import Header from '../components/nav/Header';

import { loadData } from '../actions/world';
import { getDayData } from '../actions/time';

function mapStateToProps(state) {
  return {
    world: state.world,
    time: state.time
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ getDayData, loadData }, dispatch);
}

class MapPage extends Component {
  static propTypes = {
    world: PropTypes.object.isRequired,
    time: PropTypes.object.isRequired,
    loadData: PropTypes.func.isRequired,
    getDayData: PropTypes.func.isRequired
  };
  componentDidMount() {
    this.props.loadData();
    this.props.getDayData();
  }
  render() {
    const { details, geoforms, hexes } = this.props.world;
    const { dayData } = this.props.time;
    return (
      <div>
        <Header />
        <HexGridControl hexes={hexes} details={details} dayData={dayData} geoforms={geoforms} />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MapPage);
