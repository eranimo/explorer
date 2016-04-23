import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
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

class PopulationChartTooltip extends Component {
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

class EconomicChartTooltip extends Component {
  render () {
    const value1 = this.props.payload[0].value;
    const value2 = this.props.payload[1].value;
    const value3 = this.props.payload[2].value;
    return (
      <div>
        <span style={{backgroundColor: '#333', color: '#DDD', fontWeight: 'bold', fontSize: '10px'}}>
          {convertToMoment(this.props.label).format('LL')}
        </span>
        <br />
        <span style={{backgroundColor: '#333', color: '#08CC08', fontSize: '14px'}}>
          {!_.isUndefined(value1) ? this.props.tickFormatter(value1) : ''}
        </span>
        <br />
        <span style={{backgroundColor: '#333', color: 'red', fontSize: '14px'}}>
          {!_.isUndefined(value2) ? this.props.tickFormatter(value2) : ''}
        </span>
        <br />
        <span style={{backgroundColor: '#333', color: 'lightblue', fontSize: '14px'}}>
          {!_.isUndefined(value3) ? this.props.tickFormatter(value3) : ''}
        </span>
      </div>
    );
  }
}

class JobChartTooltip extends Component {
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
              <span style={{color: 'white'}}>
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

function formatCurrency(number) {
  const formatted = '$' + _.round(number, 2).toLocaleString();
  if (number < 0) {
    return <span style={{color: 'red'}}>{formatted}</span>;
  } else if (number > 0) {
    return <span style={{color: 'rgb(8, 204, 8)'}}>{formatted}</span>;
  }
  return formatted;
}

class PopTable extends Component {
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
          </tr>
        </thead>
        <tbody>
          {_.orderBy(pops, 'id').map((pop, id) => {
            const total_trades = pop.successful_trades + pop.failed_trades;
            return (
              <tr key={id}>
                <td>{pop.pop_type.title}</td>
                <td>{pop.population.toLocaleString()}</td>
                <td>{(pop.population - pop.population_yesterday).toLocaleString()}</td>
                <td>{formatCurrency(pop.money)}</td>
                <td>{formatCurrency(pop.money - pop.money_yesterday)}</td>
                <td>{total_trades.toLocaleString()}</td>
                <td>{_.round(pop.successful_trades / total_trades * 100, 2).toLocaleString()}%</td>
                <td>{pop.bankrupt_times.toLocaleString()}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
}

class MarketTable extends Component {
  render() {
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
          {this.props.province.market.history.map(({ good, data }, id) => {
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

class SelectedHex extends Component {
  static propTypes = {
    hex: PropTypes.object,
    dayData: PropTypes.object,
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

          <dt>Natural Resources</dt>
          <dd>
            {hex.natural_resources.length > 0 ?
              hex.natural_resources.map(_.capitalize).join(', ')
            : 'None'}
          </dd>
        </dl>

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
        </dl>
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
    console.log(data)
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
    const jobs = this.props.enums.PopType;
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

          <div style={{margin: '1rem 0'}}>
            <Link to={`/details/Province/${province.id}`} className={styles.Button}>
              More Details
            </Link>
          </div>

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
            <MarketTable enums={this.props.enums} province={province} />

            {_.values(Goods).map((i) => {
              console.log(i)
              return (
                <div>
                  <hr />
                  <h2>{i.title}</h2>
                  {this.renderGoodPriceChart(i)}
                </div>
              );
            })}
          </TabPanel>
        </Tabs>
      );
    }
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
            Country info here
          </TabPanel>
        </Tabs>
        {this.renderDetails()}
      </div>
    );
  }
}

export default SelectedHex;
