import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
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

class App extends Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
    loadData: PropTypes.func.isRequired,
    getDayData: PropTypes.func.isRequired
  };

  static childContextTypes = {
    currentDay: PropTypes.object
  };

  getChildContext() {
    return { currentDay: _.cloneDeep(this.props.time.currentDay) }
  }

  componentDidMount() {
    this.props.loadData();
    this.props.getDayData();
  }

  render() {
    return (
      <div>
        {this.props.children}
        {
          (() => {
            if (process.env.NODE_ENV !== 'production') {
              const DevTools = require('./DevTools');
              return <DevTools />;
            }
          })()
        }
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
