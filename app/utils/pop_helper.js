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

export function province_population(province, timeline, currentDay) {
  let popIds = _.map(province.pops, (p) => p.id);
  let days = fetchTimeline('Pop', timeline, currentDay);

  return _(days)
    .map(({ day, data }) => {
      const population = _(data)
        .filter((rawPop, idNum) => _.includes(popIds, idNum))
        .map((p) => p.population)
        .sum();
      return { day: momentToDateString(day), population };
    })
    .value();
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
          return rawPop.pop_type.key
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
      console.log(data);
      data[province.id].market.history.forEach(({ good, data }) => {
        newData[good.key] = data.prices[0];
      });
      return { day: momentToDateString(day), ...newData };
    })
    .value();
  return chartData;
}
