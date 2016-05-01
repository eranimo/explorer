import React, { Component, PropTypes } from 'react';
import { formatCurrency } from './utils';
import styles from 'components/map/SelectedHex.module.scss';

export default class MerchantTable extends Component {
  static propTypes = {
    pops: PropTypes.array.isRequired
  };

  render() {
    const { pops } = this.props;
    const merchants = _.filter(pops, (p) => p.pop_job.name === 'merchant')
    return (
      <table className={styles.PopTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Location</th>
            <th>Money</th>
            <th>Profit</th>
            <th># Trades</th>
            <th># B</th>
            <th>Trade Success</th>
            <th>Trade Good</th>
            <th>Trade Location</th>
            <th>Trade Amount</th>
            <th>Inventory</th>
          </tr>
        </thead>
        <tbody>
          {_.orderBy(merchants, 'id').map((pop, id) => {
            const total_trades = pop.successful_trades + pop.failed_trades;
            return (
              <tr key={id}>
                <td data-tip={pop.id}>{id}</td>
                <td><a onClick={()=> this.props.select(pop.location.x, pop.location.y)}>{pop.location.name}</a></td>
                <td>{formatCurrency(pop.money)}</td>
                <td>{formatCurrency(pop.money - pop.money_yesterday)}</td>
                <td>{total_trades.toLocaleString()}</td>
                <td>{pop.bankrupt_times.toLocaleString()}</td>
                <td>{_.round(pop.successful_trades / total_trades * 100, 2).toLocaleString()}%</td>
                <td>
                  {pop.trade_good ?
                    <span style={{color: pop.trade_good.color}}>
                      {pop.trade_good.title}
                    </span>
                  : 'None'}
                </td>
                <td>{pop.trade_location ?
                  <a onClick={() => this.props.select(pop.trade_location.hex.x, pop.trade_location.hex.y)}>{pop.trade_location.name}</a>
                : 'None'}</td>
                <td>{pop.trade_amount}</td>
                <td><PopInventory inventory={pop.inventory} /></td>
              </tr>
            )
          })}
          </tbody>
      </table>
    )
  }
}
