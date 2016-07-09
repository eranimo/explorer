import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import WorldStats from '../components/statistics/WorldStats';
import Header from '../components/nav/Header';

function mapStateToProps(state) {
  return {
    hexes: state.time.worldData.hexes,
    geoforms: state.time.worldData.geoforms
  };
}


class StatsPage extends Component {
  static propTypes = {
    hexes: PropTypes.array,
    geoforms: PropTypes.array
  };
  componentDidMount() {
    document.body.style.overflowY = 'auto';
  }

  componentWillUnmount() {
    document.body.style.overflowY = 'hidden';
  }

  render() {
    if (!this.props.hexes) return <div>Loading...</div>;
    return (
      <div>
        <Header />
        <WorldStats hexes={this.props.hexes} geoforms={this.props.geoforms} />
      </div>
    );
  }
}

export default connect(mapStateToProps)(StatsPage);
