import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import WorldStats from '../components/statistics/WorldStats';
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


class StatsPage extends Component {
  static propTypes = {
    world: PropTypes.object.isRequired,
    loadData: PropTypes.func.isRequired
  };
  componentDidMount() {
    //this.props.loadData();
    document.body.style.overflowY = 'auto';
  }

  componentWillUnmount() {
    document.body.style.overflowY = 'hidden';
  }

  render() {
    return (
      <div>
        <Header />
        <WorldStats world={this.props.world} />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StatsPage);
