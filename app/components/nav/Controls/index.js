import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import styles from './style.module.css';
import DatePicker from 'react-datepicker';
import * as TimeActions from '../../../actions/time';

import 'react-datepicker/dist/react-datepicker.css';

function mapStateToProps({ time, world }) {
  return {
    currentDay: time.currentDay,
    speed: time.speed,
    isPlaying: time.isPlaying,
    timeRange: world.timeRange,
    isLoaded: world.isLoaded
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
    if (this.props.currentDay.isSame(this.props.timeRange.start)) return false;
    return this.props.currentDay.isAfter(this.props.timeRange.start);
  }

  canGoForward() {
    return this.props.currentDay.isBefore(this.props.timeRange.end);
  }

  goToFirst() {
    this.props.goToDay(this.props.timeRange.start.clone().add(1, 'days'));
  }

  goToLast() {
    this.props.goToDay(this.props.timeRange.end.clone().add(1, 'days'));
  }

  render() {
    const divider = <div className={styles.divider}></div>;
    const currentDay = this.props.currentDay;
    if (!this.props.isLoaded) return null;
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
              onChange={this.props.goToDay}
              dateFormat="MMMM Do [Y]Y"
              popoverTargetAttachment="bottom left"
              minDate={this.props.timeRange.start}
              maxDate={this.props.timeRange.end} />
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
