import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { loadData, refresh } from '../actions/world';
import { fetchFirstDay } from '../actions/time';

function mapStateToProps(state) {
  return {
    world: state.world,
    time: state.time
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchFirstDay, loadData, refresh }, dispatch);
}

class App extends Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
    loadData: PropTypes.func.isRequired,
    fetchFirstDay: PropTypes.func.isRequired
  };

  static childContextTypes = {
    currentDay: PropTypes.object
  };

  getChildContext() {
    return { currentDay: _.cloneDeep(this.props.time.currentDay) }
  }

  componentDidMount() {
    this.props.loadData();
    this.props.fetchFirstDay();

    document.onkeydown = (e) => {
      if (e.key === 'Escape') {
        console.log('Refresh!');
        this.props.refresh();
      }
    }
  }

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
