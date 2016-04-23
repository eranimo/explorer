import React, { PropTypes, Component } from 'react';
import styles from './ProvinceDetails.module.scss';

import { province_pop_jobs, province_market, province_population } from 'utils/pop_helper';
import { convertToMoment, momentToDateString } from 'utils/dates';

import { AreaStackChart, LineChart } from 'react-d3-basic';


class ProvinceDetails extends Component {
  static contextTypes = {
    currentDay: PropTypes.object
  };

  render() {
    const { province, timeline } = this.props;

    let jobData = province_pop_jobs(province.pops, timeline, this.context.currentDay);
    const jobSeries = _.map(this.props.enums.PopType, (popType) => {
      return { field: popType.name, name: popType.title, color: popType.color };
    });

    const jobTitles = _.map(jobSeries, 'field')
    jobData = jobData.map((d) => {
      const diff = _.difference(jobTitles, _.keys(d));
      diff.forEach((job) => {
        d[job] = 0;
      })
      return d;

    });

    const todayJob = _.countBy(_.map(province.pops, (p) => p.pop_type.title));

    let marketData = province_market(province, timeline, this.context.currentDay)

    let marketSeries = _.map(this.props.enums.Good, (good) => {
      return { field: good.name, name: good.title, color: good.color };
    });

    const popGrowthData = province_population(province, timeline, this.context.currentDay);

    // console.log(jobSeries);

    return (
      <div className={styles.ProvinceDetails}>
        <h1>Province {province.id}</h1>

        <div>
          <h2>Province Jobs</h2>
          <AreaStackChart
            xScale="time"
            data={jobData}
            chartSeries={jobSeries}
            x={(d) => convertToMoment(d.day).toDate()}/>

          <table>
            <thead>
              <tr>
                <th>Job Name</th>
                <th># of Pops</th>
              </tr>
            </thead>
            <tbody>
              {_.map(todayJob, (num, job) => {
                return (
                  <tr>
                    <td>{job}</td>
                    <td>{num}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <h2>Market Prices</h2>
          <LineChart
            xScale="time"
            data={marketData}
            chartSeries={marketSeries}
            x={(d) => convertToMoment(d.day).toDate()}/>
          <table>
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
              {province.market.history.map(({ good, data }) => {
                return (
                  <tr>
                    <td>{good.title}</td>
                    <td>{data.prices[0]}</td>
                    <td>{data.buy_orders[0]}</td>
                    <td>{data.sell_orders[0]}</td>
                    <td>{data.trades[0]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <h2>Population Growth</h2>
          <LineChart
            xScale="time"
            data={popGrowthData}
            chartSeries={[{field: 'population', name: 'Population', color: 'black'}]}
            x={(d) => convertToMoment(d.day).toDate()}/>

          <h2>Pops</h2>
          <div>
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Population</th>
                  <th>Growth</th>
                  <th>Money</th>
                  <th>Profit</th>
                  <th># S</th>
                  <th># F</th>
                  <th># B</th>
                  <th>Inventory</th>
                </tr>
              </thead>
              <tbody>
                {_.sortBy(province.pops, 'id').map((pop) => {
                  return (
                    <tr>
                      <td>
                        {pop.pop_type.title}
                      </td>
                      <td>
                        {pop.population}
                      </td>
                      <td>
                        {pop.population_yesterday - pop.population}
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
                        {pop.bankrupt_times}
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
      </div>
    );
  }
}

export default ProvinceDetails;
