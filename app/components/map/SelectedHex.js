import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Link } from 'react-router';
import styles from './SelectedHex.module.scss';

class SelectedHex extends Component {
  static propTypes = {
    hex: PropTypes.object,
    dayData: PropTypes.object,
    geoforms: PropTypes.array,
    deselect: PropTypes.func
  };

  static contextTypes = {
    currentDay: PropTypes.object
  };

  getProvinceAtHex() {
    let found;
    _.each(this.props.dayData.Province, (value, key) => {
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
    //console.log(province)
    let ownedSection = null;
    //console.log(province.pops);
    //console.log('Province Pop Jobs: ', job_data)

    if (province) {
      return (
        <div>
          <dl>
            <dt>Owner</dt>
            <dd>{province.owner.name}</dd>
          </dl>

          <Link to={`/details/Province/${province.id}`}>More Details</Link>
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

    console.log('context: ', this.context)
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
