import React, { Component, PropTypes } from 'react';
import { formatCurrency } from './utils';
import styles from 'components/map/SelectedHex.module.scss';

export default class MarketTable extends Component {
  static propTypes = {
    province: PropTypes.object.isRequired
  };

  render() {
    const { province } = this.props;
    return (
      <table className={styles.PopTable}>
        <thead>
          <tr>
            <th>Good</th>
            <th>Price</th>
            <th>Demand</th>
            <th>Supply</th>
            <th>Trades</th>
          </tr>
        </thead>
        <tbody>
          {province && province.market.history.map(({ good, data }, id) => {
            return (
              <tr id={id}>
                <td>{good.title}</td>
                <td>{formatCurrency(data.prices[0])}</td>
                <td>{data.buy_orders[0]}</td>
                <td>{data.sell_orders[0]}</td>
                <td>{data.trades[0]}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
}
