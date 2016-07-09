import React, { Component, PropTypes } from 'react';
import moment from 'moment';
import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import styles from './style.module.css';
import DatePicker from 'react-datepicker';
import * as TimeActions from '../../../actions/time';

import 'react-datepicker/dist/react-datepicker.css';

function mapStateToProps({ time }) {
  return {
    currentDay: time.currentDay,
    speed: time.speed,
    isPlaying: time.isPlaying,
    timeline: time.timeline,
    dayIndex: time.dayIndex
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(TimeActions, dispatch);
}

class Controls extends Component {
  static propTypes = {
    currentDay: PropTypes.object
  };

  canGoBack() {
    return this.props.dayIndex !== 0;
  }

  canGoForward() {
    return true
    // return this.props.currentDay.isBefore(this.props.timeRange.end);
  }

  goToFirst() {
    this.props.goToFirstDay();
  }

  goToLast() {
    this.props.goToDay(this.props.lastFetchedDay);
  }

  render() {
    const divider = <div className={styles.divider}></div>;
    const currentDay = this.props.currentDay;
    return (
      <div className={styles.controls}>
        {!this.props.isPlaying ?
          <label className={styles.control}>
            <span>Play</span>
            <button type="button" onClick={this.props.play}>
              <i className="fa fa-play"></i>
            </button>
          </label> :
          <label className={styles.control}>
            <span>Pause</span>
            <button type="button" onClick={this.props.pause}>
              <i className="fa fa-pause"></i>
            </button>
          </label>}

        {divider}

        <label className={styles.control}>
          <span>First Day</span>
          <button type="button" onClick={this.goToFirst.bind(this)}>
            <i className="fa fa-step-backward"></i>
          </button>
        </label>

        <label className={styles.control}>
          <span>Prev Day</span>
          <button type="button" onClick={this.props.previousDay} disabled={!this.canGoBack()}>
            <i className="fa fa-arrow-left"></i>
          </button>
        </label>

        <label className={styles.control}>
          <span>Current Day:</span>
          <div>
            <DatePicker
              className={styles.datepicker}
              selected={currentDay}
              tetherConstraints={[ { to: 'body', attachment: 'together' } ]}
              onChange={this.props.goToDay}
              dateFormat="MMMM Do [Y]Y"
              popoverTargetAttachment="bottom left"
              minDate={moment('0001-01-01')}
              maxDate={this.props.lastFetchedDay} />
          </div>
        </label>

        <label className={styles.control}>
          <span>Next Day</span>
          <button type="button" onClick={this.props.nextDay} disabled={!this.canGoForward()}>
            <i className="fa fa-arrow-right"></i>
          </button>
        </label>

        <label className={styles.control}>
          <span>Last Day</span>
          <button type="button" onClick={this.goToLast.bind(this)}>
            <i className="fa fa-step-forward"></i>
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
