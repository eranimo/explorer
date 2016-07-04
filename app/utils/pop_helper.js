import { convertToMoment, momentToDateString } from './dates';


function fetchTimeline (modelType, timeline, currentDay, days=30) {
  const firstDay = currentDay.clone().subtract(days, 'days');
  const nextDay = currentDay.clone().add(1, 'days');
  return _(timeline[modelType])
    .map((raw, dayString) => {
      return { day: convertToMoment(dayString), data: raw };
    })
    .sortBy('day')
    .filter(({ day }) => day.isBetween(firstDay, nextDay, 'day'))
    .value();
}

export function province_economic(province, timeline, currentDay) {
  let popIds = _.map(province.pops, (p) => p.id);
  let days = fetchTimeline('Pop', timeline, currentDay);

  return _(days)
    .map(({ day, data }) => {
      let successful_trades = 0;
      let failed_trades = 0;
      let bankrupt_times = 0;

      let last_successful_trades = 0;
      let last_failed_trades = 0;
      let last_bankrupt_times = 0;

      _.filter(data, (rawPop, idNum) => _.includes(popIds, idNum))
        .forEach((p) => {
          successful_trades += p.successful_trades// - last_successful_trades;
          failed_trades += p.failed_trades// - last_failed_trades;
          bankrupt_times += p.bankrupt_times// - last_bankrupt_times;

          last_successful_trades = p.successful_trades;
          last_failed_trades = p.failed_trades;
          last_bankrupt_times = p.bankrupt_times;
        });

      return {
        day: momentToDateString(day),
        successful_trades, failed_trades, bankrupt_times
      };
    })
    .value();
}

export function province_cumulative(province, timeline, currentDay, key) {
  let popIds = _.map(province.pops, (p) => p.id);
  let days = fetchTimeline('Pop', timeline, currentDay);
  return _(days)
    .map(({ day, data }) => {
      const result = _(data)
        .filter((rawPop, idNum) => _.includes(popIds, idNum))
        .map((p) => p[key])
        .sum();
      return { day: momentToDateString(day), [key]: result };
    })
    .value();
}

export function province_population(province, timeline, currentDay) {
  return province_cumulative(province, timeline, currentDay, 'population');
}

export function province_money(province, timeline, currentDay) {
  return province_cumulative(province, timeline, currentDay, 'money');
}

// gets the pop jobs within the last 30 days
export function province_pop_jobs(pops, timeline, currentDay) {
  let popIds = _.map(pops, (p) => p.id);
  let days = fetchTimeline('Pop', timeline, currentDay);
  const chartData = _(days)
    .map(({ day, data }) => {
      const newData = _(data)
        .filter((rawPop, idNum) => _.includes(popIds, idNum))
        .map((rawPop) => {
          return rawPop.pop_job.key
        })
        .countBy()
        .value();
      return { day: momentToDateString(day), ...newData };
    })
    .value();
  return chartData;
}


// gets the pop jobs within the last 30 days
export function province_market(province, timeline, currentDay) {
  let days = fetchTimeline('Province', timeline, currentDay);
  const chartData = _(_.clone(days))
    .map(({ day, data }) => {
      let newData = {}
      if (data[province.id]) {
        data[province.id].market.history.forEach(({ good, data }) => {
          newData[good.key] = data.prices[0];
        });
        return { day: momentToDateString(day), ...newData };
      }
    })
    .filter()
    .value();
  return chartData;
}
