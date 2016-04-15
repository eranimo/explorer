import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Header from '../components/nav/Header';

import { loadData } from '../actions/world';
import { getDayData } from '../actions/time';

import ProvinceDetails from 'components/details/ProvinceDetails';

function mapStateToProps(state) {
  return {
    world: state.world,
    time: state.time
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ getDayData, loadData }, dispatch);
}


class DetailsPage extends Component {
  static propTypes = {
    world: PropTypes.object.isRequired,
    loadData: PropTypes.func.isRequired,
    getDayData: PropTypes.func.isRequired
  };
  componentDidMount() {
    // this.props.loadData();
    // this.props.getDayData();
    document.body.style.overflowY = 'auto';
  }

  componentWillUnmount() {
    document.body.style.overflowY = 'hidden';
  }

  render() {
    if (this.props.world.isLoaded) {
      const { type, id } = this.props.params;
      const foundModel = this.props.time.dayData[type][id];
      console.log(foundModel)
      return (
        <div>
          <Header />
          <ProvinceDetails province={foundModel}
            enums={this.props.world.enums}
            timeline={this.props.world.timeline} />
        </div>
      );
    }
    return <div>Loading...</div>
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DetailsPage);
