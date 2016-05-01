import React, { Component, PropTypes } from 'react';
import { formatCurrency, formatGood } from './utils';
import styles from 'components/map/SelectedHex.module.scss';


export default class VATTable extends Component {
  static propTypes = {
    vat: PropTypes.array.isRequired
  };

  render() {
    const { vat } = this.props;
    return (
      <table className={styles.PopTable}>
        <thead>
          <tr>
            <th>Good</th>
            <th>VAT Tax</th>
          </tr>
        </thead>
        <tbody>
          {vat && vat.map(({ good, tax }, id) => {
            return (
              <tr key={id}>
                <td>{formatGood(good)}</td>
                <td>{_.round(tax * 100, 2)}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
}
