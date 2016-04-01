import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import styles from './SelectedHex.module.scss';

class SelectedHex extends Component {
  static propTypes = {
    hex: PropTypes.object,
    dayData: PropTypes.object,
    geoforms: PropTypes.array
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
    if (province) {
      return (
        <div>
          Owner: {province.owner.name}
        </div>
      )
    }
    return null;
  }

  renderTitle () {
    if (!this.getProvinceAtHex()) {
      const hex = this.props.hex;
      return `Hex at ${hex.x}, ${hex.y}`;
    }
    return 'Province';
  }

  render() {
    // find occupied provinces
    if (!this.getProvinceAtHex()) {
      return (
        <div>
          <div className={styles.TitleBar}>{this.renderTitle()}</div>
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
        <div className={styles.TitleBar}>{this.renderTitle()}</div>
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
