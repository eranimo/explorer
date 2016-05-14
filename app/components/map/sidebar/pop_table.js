import React, { Component, PropTypes } from 'react';
import { formatCurrency } from './utils';
import styles from 'components/map/SelectedHex.module.scss';
import PopInventory from './pop_inventory';

export default class PopTable extends Component {
  static propTypes = {
    pops: PropTypes.array.isRequired
  };

  render () {
    const { pops } = this.props;
    return (
      <table className={styles.PopTable}>
        <thead>
          <tr>
            <th>Job</th>
            <th>Size</th>
            <th>+/-</th>
            <th>Money</th>
            <th>Profit</th>
            <th># Trades</th>
            <th>Trade Success</th>
            <th data-tip="Bankruptcies"># B</th>
            <th>Inventory</th>
          </tr>
        </thead>
        <tbody>
          {_.orderBy(pops, 'id').map((pop, id) => {
            const total_trades = pop.successful_trades + pop.failed_trades;
            return (
              <tr key={id}>
                <td data-tip={pop.id}>{pop.pop_job.title}</td>
                <td>{pop.population.toLocaleString()}</td>
                <td>{(pop.population - pop.population_yesterday).toLocaleString()}</td>
                <td>{formatCurrency(pop.money)}</td>
                <td>{formatCurrency(pop.money - pop.money_yesterday)}</td>
                <td>{total_trades.toLocaleString()}</td>
                <td>{_.round(pop.successful_trades / total_trades * 100, 2).toLocaleString()}%</td>
                <td>{pop.bankrupt_times.toLocaleString()}</td>
                <td><PopInventory inventory={pop.inventory} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
}
