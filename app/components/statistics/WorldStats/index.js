import React, { Component, PropTypes } from 'react';
import styles from './style.module.css';
import _ from 'lodash';

import { Treemap } from 'react-d3';

export default class Statistics extends Component {
  static propTypes = {
    world: PropTypes.object
  };

  biomeData() {
    let biomes = {};
    let total = 0;
    this.props.world.hexes.forEach((row) => {
      row.forEach((hex) => {
        if (_.isNumber(biomes[hex.biome.title])) {
          biomes[hex.biome.title] += 1;
        } else {
          biomes[hex.biome.title] = 0;
        }
        total += 1;
      });
    });
    return _.map(biomes, (count, biomeName) => {
      return {
        label: biomeName + ' ' +  _.round((count / total) * 100, 2) + '%',
        value: count
      };
    });
  }

  geoformData(){
    let geoforms = {};
    let total = 0;
    this.props.world.geoforms.forEach((geoform) => {
      if (_.isNumber(geoforms[geoform.type])) {
        geoforms[geoform.type] += geoform.size;
        total += geoform.size;
      } else {
        geoforms[geoform.type] = 0;
      }
    });
    return _.map(geoforms, (count, geoName) => {
      return {
        label: _.replace(_.capitalize(geoName), '_', ' ') + ' ' +  _.round((count / total) * 100, 2) + '%',
        value: count
      };
    });
  }

  render() {
    console.log(this.props.world);
    return (
      <div>
        <div className={styles.Statistics}>
          <Treemap
            data={this.biomeData()}
            width={900}
            height={250}
            textColor="#484848"
            fontSize="12px"
            title="World Biomes"
            hoverAnimation={true} />
          <Treemap
            data={this.geoformData()}
            width={900}
            height={250}
            textColor="#484848"
            fontSize="10px"
            title="World Geoforms"
            hoverAnimation={true} />
        </div>
      </div>
    );
  }
}
