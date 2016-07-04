import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Link } from 'react-router';
import styles from './SelectedHex.module.scss';
import {
  province_population,
  province_money,
  province_economic,
  province_pop_jobs,
  province_market
} from 'utils/pop_helper';
import { convertToMoment } from 'utils/dates';
import {
  LineChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Area,
  ReferenceLine
} from 'recharts';

import ReactTooltip from 'react-tooltip';

import {
  PopulationChartTooltip,
  EconomicChartTooltip,
  JobChartTooltip
} from './sidebar/tooltips'
import PopTable from './sidebar/pop_table';
import PopInventory from './sidebar/pop_inventory';
import MerchantTable from './sidebar/merchant_table';
import { formatCurrency } from './sidebar/utils';
import MarketTable from './sidebar/market_table';
import VATTable from './sidebar/vat_table';

function mapStateToProps(state) {
  return {
    dayData: state.time.dayData,
    timeline: state.time.timeline,
    timeRange: state.time.timeRange,
    ...state.world
  };
}


class SelectedHex extends Component {
  static propTypes = {
    hex: PropTypes.object,
    dayData: PropTypes.object,
    timeline: PropTypes.object,
    timeRange: PropTypes.object,
    geoforms: PropTypes.array,
    deselect: PropTypes.func,
    select: PropTypes.func
  };

  static contextTypes = {
    currentDay: PropTypes.object
  };

  state = {
    detailsOpen: false
  };

  getProvinceAtHex() {
    let found;
    _.each(this.props.dayData.Province, (value, key) => {
      if (value.hex.x === this.props.hex.x && value.hex.y === this.props.hex.y) {
        found = value;
      }
    });
    if (found) {
      return found;
    }
    return false;
  }

  renderHexTab() {
    const { hex, geoforms, enums } = this.props;
    let geoform = _.find(geoforms, { id: hex.geoform });
    geoform = geoform && geoform.type || 'None';
    return (
      <div>
        <h2>Details</h2>
        <dl>
          <dt>Location</dt>
          <dd>{hex.x}, {hex.y}</dd>

          <dt>Biome</dt>
          <dd>{hex.biome.title}</dd>

          <dt>Type</dt>
          <dd>{_.capitalize(hex.type)}</dd>

          <dt>Avg Temperature</dt>
          <dd>{hex.temperature} &deg;F</dd>

          <dt>Moisture Rating</dt>
          <dd>{hex.moisture} units</dd>

          <dt>Is coastal</dt>
          <dd>{_.some(hex.edges, 'is_coast') ? 'Yes' : 'No'}</dd>

          <dt>Contains river</dt>
          <dd>{_.some(hex.edges, 'is_river') ? 'Yes' : 'No'}</dd>

          <dt>Geoform</dt>
          <dd>{_.capitalize(geoform)}</dd>

          {/*<dt>Natural Resources</dt>
          <dd>
            {hex.res.length > 0 ?
              hex.res.map(i => i.key).map(_.capitalize).join(', ')
            : 'None'}
          </dd>*/}
        </dl>

        {/*
        TODO: compute neighbors
        <hr />
        <h2>Neighbors</h2>
        <dl>
          {_.map(hex.neighbors, ({ x, y}, side) => {
            return (
              <span>
                <dt>{_.capitalize(side.replace('_', ' '))}</dt>
                <dd><a onClick={() => this.props.select(x, y)}>{x}, {y}</a></dd>
              </span>
            )
          })}
        </dl>*/}
      </div>
    );
  }

  renderLineChart(data, key, color, tickFormatter) {
    const province = this.getProvinceAtHex();
    return (
      <div className={styles.Chart}>
        <LineChart width={300} height={250} data={data}
          margin={{ top: 30, right: 5, left: 10, bottom: 0 }}>
          <XAxis dataKey="day" tickFormatter={(i) => convertToMoment(i).format('l')} />
          <YAxis tickFormatter={tickFormatter} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip content={<PopulationChartTooltip tickFormatter={tickFormatter} />}/>
          <ReferenceLine x={province.date_founded} stroke="black" label="Date Founded" />
          <Legend />
          <Line type="linear"
            dataKey={key}
            stroke={color}
            dot={false}
            isAnimationActive={false} />
        </LineChart>
      </div>
    );
  }

  renderPopulationChart() {
    const province = this.getProvinceAtHex();
    let data = province_population(province, this.props.timeline, this.context.currentDay)
    return this.renderLineChart(data, 'population', 'red', (i) => _.round(i).toLocaleString())
  }

  renderMoneyChart() {
    const province = this.getProvinceAtHex();
    let data = province_money(province, this.props.timeline, this.context.currentDay)
    return this.renderLineChart(data, 'money', '#08CC08', (i) => '$' + _.round(i, 2).toLocaleString())
  }

  renderGoodPriceChart(good) {
    const province = this.getProvinceAtHex();
    let data = province_market(province, this.props.timeline, this.context.currentDay)
    return this.renderLineChart(data, good.name, good.color, (i) => '$' + i.toLocaleString())
  }

  renderEconomyChart() {
    const province = this.getProvinceAtHex();
    let data = province_economic(province, this.props.timeline, this.context.currentDay)
    const tickFormatter = (i) => _.round(i).toLocaleString()
    return (
      <div className={styles.Chart}>
        <LineChart width={300} height={250} data={data}
          margin={{ top: 30, right: 5, left: 10, bottom: 0 }}>
          <XAxis dataKey="day" tickFormatter={(i) => convertToMoment(i).format('l')} />
          <YAxis tickFormatter={tickFormatter} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip content={<EconomicChartTooltip tickFormatter={tickFormatter} />}/>
          <ReferenceLine x={province.date_founded} stroke="black" label="Date Founded" />
          <Legend />
          <Line type="linear"
            dataKey="successful_trades"
            stroke="#08CC08"
            dot={false}
            isAnimationActive={false} />
          <Line type="linear"
            dataKey="failed_trades"
            stroke="red"
            dot={false}
            isAnimationActive={false} />
          <Line type="linear"
            dataKey="bankrupt_times"
            stroke="lightblue"
            dot={false}
            isAnimationActive={false} />
        </LineChart>
      </div>
    );
  }

  renderJobChart() {
    const province = this.getProvinceAtHex();
    let data = province_pop_jobs(province.pops, this.props.timeline, this.context.currentDay)
    const tickFormatter = (i) => _.round(i).toLocaleString()
    console.log('d', data)
    const jobs = this.props.enums.PopJob;
    return (
      <div className={styles.Chart}>
        <AreaChart width={300} height={250} data={data}
          margin={{ top: 30, right: 5, left: 10, bottom: 0 }}>
          <XAxis dataKey="day" tickFormatter={(i) => convertToMoment(i).format('l')} />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip content={<JobChartTooltip jobs={jobs} />}/>
          <ReferenceLine x={province.date_founded} stroke="black" label="Date Founded" />
          <Legend />
          {_.map(jobs, (popType) => {
            return (
              <Area
                type="monotone"
                dataKey={popType.name}
                stackId="1"
                stroke={popType.color}
                fill={popType.color}
                dot={false}
                isAnimationActive={false} />
            )
          })}
        </AreaChart>
      </div>
    );
  }

  renderProvinceTab() {
    const province = this.getProvinceAtHex();
    const total_population = _.sum(_.map(province.pops, 'population'));
    const total_savings = _.sum(_.map(province.pops, 'money'));
    const cumulate = (key) => _.sum(_.map(province.pops, key))

    const success = cumulate('successful_trades');
    const fail = cumulate('failed_trades');
    const total = success + fail;
    const ratio = (success / total) * 100

    if (province) {
      return (
        <div>
          <h2>
            <span>Details</span>
          </h2>
          <dl>
            <dt>Owner</dt>
            <dd>{province.owner.name}</dd>
            <dt>Capital</dt>
            <dd>{province.is_capital ? 'Yes' : 'No'}</dd>
            <dt>Population</dt>
            <dd>{total_population.toLocaleString()}</dd>
            <dt>Number of Pops</dt>
            <dd>{province.pops.length.toLocaleString()}</dd>
            <dt>Total Savings</dt>
            <dd>{'$'+_.round(total_savings).toLocaleString()}</dd>
            <dt>Number of Bankruptcies</dt>
            <dd>{cumulate('bankrupt_times').toLocaleString()}</dd>
            <dt>Number of Successful Trades</dt>
            <dd>{success.toLocaleString()}</dd>
            <dt>Number of Failed Trades</dt>
            <dd>{fail.toLocaleString()}</dd>
            <dt>Trade Success Ratio</dt>
            <dd>{_.round(ratio, 2)}%</dd>
          </dl>

          <hr />

          <h2>Population over time</h2>
          {this.renderPopulationChart()}

          <hr />
          <h2>Money over time</h2>
          {this.renderMoneyChart()}

          <hr />
          <h2>Economic Health</h2>
          <small style={{color: 'gray'}}>Cumulative over time</small>
          {this.renderEconomyChart()}
        </div>
      )
    }
    return null;
  }

  renderDetailsButton() {
    if (this.state.detailsOpen) {
      return (
        <button data-tip="Close Details view" type="button" className={styles.DetailsIcon}>
          <i className="fa fa-arrow-left" onClick={this.closeDetails.bind(this)}></i>
        </button>
      );
    } else {
      return (
        <button data-tip="Open Details view" type="button" className={styles.DetailsIcon}>
          <i className="fa fa-arrow-right" onClick={this.openDetails.bind(this)}></i>
        </button>
      );
    }
  }

  renderTitle () {
    let title;
    const province = this.getProvinceAtHex();
    if (!province) {
      const hex = this.props.hex;
      title = `Hex at ${hex.x}, ${hex.y}`;
    } else {
      title = (
        <span>
          <span data-tip="Province Name">{province.name}</span>
          &nbsp;
          <small data-tip="Country" style={{color: 'gray'}}>{province.owner.name}</small>
        </span>
      );
    }

    return (
      <div className={styles.TitleBar}>
        {title}
        <button type="button" data-tip="Close Sidebar">
          <i className="fa fa-times" onClick={this.props.deselect}></i>
        </button>
      </div>
    )
  }

  closeDetails() {
    this.setState({ detailsOpen: false })
  }

  openDetails() {
    this.setState({ detailsOpen: true })
  }

  renderDetails() {
    if (this.state.detailsOpen) {
      const province = this.getProvinceAtHex();
      const Goods = this.props.enums.Good;
      return (
        <Tabs className={styles.Details}>
          <TabList>
            <Tab>Pops</Tab>
            <Tab>Market</Tab>
            <Tab>Merchants</Tab>
          </TabList>
          <TabPanel>
            <h2>Pops in Province</h2>
            <PopTable pops={province.pops} />

            <hr />
            <h2>Jobs</h2>
            {this.renderJobChart()}
          </TabPanel>
          <TabPanel>
            <h2>Good Prices</h2>
            <MarketTable
              enums={this.props.enums}
              province={province} />

            <dl>
              <dt>Most Demanded Good</dt>
              <dd>{province.market.most_demanded_good ? province.market.most_demanded_good.title : 'None'}</dd>
              <dt>Most Profitable Job</dt>
              <dd>{province.market.most_profitable_pop_job ? province.market.most_profitable_pop_job.title : 'None'}</dd>
              <dt>Most Expensive Good</dt>
              <dd>{province.market.most_expensive_good ? province.market.most_expensive_good.title : 'None'}</dd>
            </dl>

            {_.values(Goods).map((i) => {
              return (
                <div>
                  <hr />
                  <h2>{i.title}</h2>
                  {this.renderGoodPriceChart(i)}
                </div>
              );
            })}
          </TabPanel>
          <TabPanel>
            <h2>Merchants</h2>
            <MerchantTable pops={province.pops} select={this.props.select} />
          </TabPanel>
        </Tabs>
      );
    }
  }

  render() {
    // find occupied provinces
    const province = this.getProvinceAtHex();
    console.log('province', province)
    if (!province) {
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
      <div className={styles.SelectedHex}>
        <ReactTooltip />
        {this.renderTitle()}
        {this.renderDetailsButton()}
        <Tabs>
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
            <h2>Details</h2>
            <dl>
              <dt>Name</dt><dd>{province.owner.name}</dd>
              <dt># of Provinces</dt><dd>{province.owner.provinces.length}</dd>
              <dt>Total Population</dt><dd>{province.owner.total_population.toLocaleString()}</dd>
              <dt>Cash Reserves</dt>
              <dd>{formatCurrency(province.owner.money)}</dd>
            </dl>
            <hr />
            <h2>Provinces</h2>
            <table className={styles.PopTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Population</th>
                  <th># of Pops</th>
                </tr>
              </thead>
              <tbody>
                {_.reverse(_.orderBy(province.owner.provinces, 'population')).map((province) => {
                  return (
                    <tr>
                      <td>
                        <a onClick={() => this.props.select(province.hex.x, province.hex.y)}>
                        {province.name}&nbsp;
                        {province.is_capital ? <span data-tip="Capital Province" className="fa fa-star"></span> : ''}
                        </a>
                      </td>
                      <td>{province.population.toLocaleString()}</td>
                      <td>{province.pops.length.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <hr />
            <h2>VAT Tax Rates</h2>
            <VATTable vat={province.owner.vat_tax} />
          </TabPanel>
        </Tabs>
        {this.renderDetails()}
      </div>
    );
  }
}

export default connect(mapStateToProps)(SelectedHex);
