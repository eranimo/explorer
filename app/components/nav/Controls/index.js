import React, { Component, PropTypes } from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import styles from './style.module.css';

import * as TimeActions from '../../../actions/time';

function mapStateToProps({ time }) {
  return {
    currentDay: time.currentDay,
    speed: time.speed
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(TimeActions, dispatch);
}

class Controls extends Component {
  static propTypes = {
    currentDay: PropTypes.object
  };

  render() {
    const divider = <div className={styles.divider}></div>;
    const currentDay = this.props.currentDay.format('MMMM Do [Y]Y');
    return (
      <div className={styles.controls}>
        <label className={styles.control}>
          <span>Play</span>
          <button type="button">
            <i className="fa fa-play"></i>
          </button>
        </label>

        {divider}

        <label className={styles.control}>
          <span>Last Day</span>
          <button type="button" onClick={this.props.previousDay}>
            <i className="fa fa-arrow-left"></i>
          </button>
        </label>

        <label className={styles.control}>
          <span>Current Day:</span>
          <div>{currentDay}</div>
        </label>

        <label className={styles.control}>
          <span>Next Day</span>
          <button type="button" onClick={this.props.nextDay}>
            <i className="fa fa-arrow-right"></i>
          </button>
        </label>

        {divider}

        <label className={styles.control}>
          <span>Slower</span>
          <button type="button" onClick={this.props.slower}>
            <i className="fa fa-backward"></i>
          </button>
        </label>

        <label className={styles.control}>
          <span>Speed:</span>
          <div>{this.props.speed}x</div>
        </label>

        <label className={styles.control}>
          <span>Faster</span>
          <button type="button" onClick={this.props.faster}>
            <i className="fa fa-forward"></i>
          </button>
        </label>
      </div>
    );
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(Controls);
