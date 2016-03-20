import React, { Component, PropTypes } from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import HexGridControl from '../components/HexGridControl';
import Header from '../components/nav/Header';
import * as WorldActions from '../actions/world';

function mapStateToProps(state) {
  return {
    world: state.world
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(WorldActions, dispatch);
}

class MapPage extends Component {
  static propTypes = {
    world: PropTypes.object.isRequired,
    loadData: PropTypes.func.isRequired
  };
  componentDidMount() {
    this.props.loadData();
  }
  render() {
    console.log(this.props.world);
    return (
      <div>
        <Header />
        <HexGridControl hexes={this.props.world.hexes}
          details={this.props.world.details}
          currentDay={this.props.world.currentDay}
          geoforms={this.props.world.geoforms}
        />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MapPage);
