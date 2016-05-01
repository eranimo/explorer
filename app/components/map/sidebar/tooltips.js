import React, { Component, PropTypes } from 'react';
import { convertToMoment } from 'utils/dates';

export class PopulationChartTooltip extends Component {
  render () {
    const value = this.props.payload[0].value;
    return (
      <div>
        <div style={{color: '#DDD', fontWeight: 'bold', fontSize: '10px'}}>
          {convertToMoment(this.props.label).format('LL')}
        </div>
        <div style={{color: 'white', fontSize: '14px'}}>
          {value ? this.props.tickFormatter(value) : ''}
        </div>
      </div>
    );
  }
}

export class EconomicChartTooltip extends Component {
  render () {
    const value1 = this.props.payload[0].value;
    const value2 = this.props.payload[1].value;
    const value3 = this.props.payload[2].value;
    return (
      <div>
        <span style={{backgroundColor: '#333', color: '#DDD', fontWeight: 'bold', fontSize: '10px'}}>
          {convertToMoment(this.props.label).format('LL')}
        </span>
        <br />
        <span style={{backgroundColor: '#333', color: '#08CC08', fontSize: '14px'}}>
          {!_.isUndefined(value1) ? this.props.tickFormatter(value1) : ''}
        </span>
        <br />
        <span style={{backgroundColor: '#333', color: 'red', fontSize: '14px'}}>
          {!_.isUndefined(value2) ? this.props.tickFormatter(value2) : ''}
        </span>
        <br />
        <span style={{backgroundColor: '#333', color: 'lightblue', fontSize: '14px'}}>
          {!_.isUndefined(value3) ? this.props.tickFormatter(value3) : ''}
        </span>
      </div>
    );
  }
}

export class JobChartTooltip extends Component {
  render () {
    return (
      <div>
        <span style={{backgroundColor: '#333', color: '#DDD', fontWeight: 'bold', fontSize: '10px'}}>
          {convertToMoment(this.props.label).format('LL')}
        </span>
        <br />
        <span style={{backgroundColor: '#333'}}>
          {this.props.payload.map((i) => {
            return (
              <span style={{color: 'white'}} key={i.name}>
                <span style={{color: i.color}}>{i.name}</span><span style={{color: 'white'}}>:</span>&nbsp;
                <span style={{color: 'white'}}>{i.value ? i.value : 0}</span>
                <br />
              </span>
            )
          })}
        </span>
      </div>
    )
  }
}
