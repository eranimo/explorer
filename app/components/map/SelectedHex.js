import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import styles from './SelectedHex.module.scss';

class SelectedHex extends Component {
  static propTypes = {
    hex: PropTypes.object,
    dayData: PropTypes.object,
    geoforms: PropTypes.array,
    deselect: PropTypes.func
  };

  getProvinceAtHex() {
    let found;
    _.each(this.props.dayData.Province, (value, key) => {
      console.log(value, this.props.hex)
      if (value.hex.id === this.props.hex.id) {
        found = value;
      }
    });
    if (found) {
      return found;
    }
    return false;
  }

  renderHexTab() {
    const { hex, geoforms } = this.props;
    let geoform = _.find(geoforms, { id: hex.geoform });
    geoform = geoform && geoform.type || 'None';
    return (
      <dl>
        <dt>Location</dt>
        <dd>{hex.x}, {hex.y}</dd>

        <dt>Biome</dt>
        <dd>{hex.biome.title}</dd>

        <dt>Type</dt>
        <dd>{hex.type}</dd>

        <dt>Avg Temperature</dt>
        <dd>{hex.temperature} &deg;F</dd>

        <dt>Moisture Rating</dt>
        <dd>{hex.moisture} units</dd>

        <dt>Is coastal</dt>
        <dd>{_.some(hex.edges, 'is_coast') ? 'Yes' : 'No'}</dd>

        <dt>Has river</dt>
        <dd>{_.some(hex.edges, 'is_river') ? 'Yes' : 'No'}</dd>

        <dt>Geoform</dt>
        <dd>{geoform}</dd>
      </dl>
    );
  }

  renderProvinceTab() {
    const province = this.getProvinceAtHex();
    console.log(province)
    let ownedSection = null;
    console.log(province.pops);
    const sortedPops = _.sortBy(province.pops, 'id');
    if (province) {
      return (
        <div>
          <dl>
            <dt>Owner</dt>
            <dd>{province.owner.name}</dd>
          </dl>
          <hr />
          Pops
          <div style={{fontSize: '12px', overflow: 'auto', width: '500px'}}>
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Money</th>
                  <th>Profit</th>
                  <th># S</th>
                  <th># F</th>
                  <th>Inventory</th>
                </tr>
              </thead>
              <tbody>
                {sortedPops.map((pop) => {
                  return (
                    <tr>
                      <td>
                        {pop.pop_type.title}
                      </td>
                      <td>
                        {_.round(pop.money, 2)}
                      </td>
                      <td>
                        {_.round(pop.money - pop.money_yesterday, 2)}
                      </td>
                      <td>
                        {pop.successful_trades}
                      </td>
                      <td>
                        {pop.failed_trades}
                      </td>
                      <td>
                        {pop.inventory.map((inv) => {
                          const amount = _.sum(_.map(inv.contents, 'amount')) || 0;
                          return `${inv.good.title}: ${amount}; `
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    }
    return null;
  }

  renderTitle () {
    let title;
    if (!this.getProvinceAtHex()) {
      const hex = this.props.hex;
      title = `Hex at ${hex.x}, ${hex.y}`;
    } else {
      title = 'Province';
    }

    return (
      <div className={styles.TitleBar}>
        {title}
        <button type="button">
          <i className="fa fa-times" onClick={this.props.deselect}></i>
        </button>
      </div>
    )
  }

  render() {
    // find occupied provinces
    if (!this.getProvinceAtHex()) {
      return (
        <div>
          {this.renderTitle()}
          <Tabs className={styles.SelectedHex}>
            <TabList>
              <Tab>Hex</Tab>
            </TabList>
            <TabPanel>{this.renderHexTab()}</TabPanel>
          </Tabs>
        </div>
      )
    }

    return (
      <div>
        {this.renderTitle()}
        <Tabs className={styles.SelectedHex}>
          <TabList>
            <Tab>Hex</Tab>
            <Tab>Province</Tab>
            <Tab>Country</Tab>
          </TabList>
          <TabPanel>
            {this.renderHexTab()}
          </TabPanel>
          <TabPanel>
            {this.renderProvinceTab()}
          </TabPanel>
          <TabPanel>
            Country info here
          </TabPanel>
        </Tabs>
      </div>
    );
  }
}

export default SelectedHex;
