import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { loadHistory } from '../actions/time';
import { convertToMoment, momentToDateString } from '../utils/dates';


function mapStateToProps(state) {
  return {
    time: state.time,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ loadHistory }, dispatch);
}

class App extends Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
    time: PropTypes.object.isRequired,
    loadHistory: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.props.loadHistory();
  }

  render() {
    // if (this.props.time.isLoading) {
    //   return <div>Loading...</div>;
    // }
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
