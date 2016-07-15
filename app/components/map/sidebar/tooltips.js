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

export function AggregateTooltip(series) {
  return ({ payload, label, tickFormatter }) => {
    const sortedPayload = _.orderBy(payload, 'value', 'desc');
    return (
      <div>
        <span style={{ backgroundColor: '#333', color: '#DDD', fontWeight: 'bold', fontSize: '10px' }}>
          {convertToMoment(label).format('LL')}
        </span>
        <br />
        {sortedPayload.map(({ color, value }, index) => {
          return [
            <span
              key={index}
              style={{ backgroundColor: '#333', color, fontSize: '14px' }}
            >
              {value ? tickFormatter(value) : ''}
            </span>,
            <br />
          ];
        })}
      </div>
    );
  };
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
