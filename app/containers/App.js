import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { loadData, refresh } from '../actions/world';
import { fetchFirstDay } from '../actions/time';
import { convertToMoment, momentToDateString } from '../utils/dates';

class History {

  constructor (dayIndex, timeline) {
    this.dayIndex = dayIndex;
    this.timeline = timeline;

    // all the days in the past up to today
    this.history_days = _.take(timeline, dayIndex + 1);
  }


  /**
   * aggregate - Returns an array of like this:
   * {
   *   day: Moment,
   *   key: Number
   *   ...
   * }
   * where `key` is the aggregate of the key parameter of all models in the history
   * @param  {type} model       Which model in the history to aggregate over
   * @param  {type} key         Which key to aggregate
   * @param  {type} filterFunc  Filter function
   * @param  {type} day         How far to look back into history
   * @return {type}             Array[Object{day, [key]}]
   */
  aggregate(model, key, filterFunc=_.identity, days=30) {
    const mapSingle = ({ day, data }) => {
      const result = _(data[model])
        .filter(filterFunc)
        .map((p) => p[key])
        .sum();
      return { day, [key]: result };
    };

    const mapMultiple = ({ day, data }) => {
      const iterStore = {};
      key.forEach(key => {
        iterStore[key] = 0;
      });
      _(data[model])
        .filter(filterFunc)
        .forEach(i => {
          key.forEach(key => {
            iterStore[key] += i[key];
          });
        });
      return { day, ...iterStore };
    };

    return _(this.history_days)
      .takeRight(days)
      .map(_.isArray(key) ? mapMultiple : mapSingle)
      .value();
  }



  /**
   * market - Returns aggregate market prices of all goods
   * @param  {type} provinceId  Province ID of Market
   * @param  {type} days        Number of days to look back
   * @return {type}             Array[Object{day, ...Good.name}]
   */
  market(provinceId, days=30) {
    return _(this.history_days)
      .takeRight(days)
      .map(({ day, data }) => {
        let newData = {}
        if (data.Province[provinceId]) {
          data.Province[provinceId].market.history.forEach(({ good, data }) => {
            newData[good.name] = data.prices[0];
          });
          return { day, ...newData };
        }
      })
      .value();
  }


  jobs(provinceId, days=30) {
    return _(this.history_days)
      .takeRight(days)
      .map(({ day, data }) => {
        // filter pops from other provinces
        const province = data.Province[provinceId]
        if (!province) {
          throw new Error(`Province with ID '${provinceId}' not found`);
        }
        const popIds = _.map(province.pops, p => p.id);
        const jobData = _(data.Pop)
          .filter((rawPop, idNum) => _.includes(popIds, idNum))
          .map(rawPop => rawPop.pop_job.name)
          .countBy()
          .value();
        return { day, ...jobData };
      })
      .value();
  }

}



function mapStateToProps(state) {
  return {
    world: state.world,
    time: state.time,
    dayData: state.time.dayData
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchFirstDay, loadData, refresh }, dispatch);
}

class App extends Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
    dayData: PropTypes.object.isRequired,
    loadData: PropTypes.func.isRequired,
    fetchFirstDay: PropTypes.func.isRequired
  };

  static childContextTypes = {
    currentDay: PropTypes.object,
    dayIndex: PropTypes.number,
    history: PropTypes.object
  };

  shouldComponentUpdate (nextProps) {
    if (Object.keys(nextProps.dayData).length === 0) return false;
    return !_.isEqual(this.props.dayData, nextProps.dayData);
  }

  getChildContext() {
    console.log('context has been updated!', this.props.time);
    const { currentDay, dayIndex, timeline } = this.props.time;
    return {
      currentDay: _.cloneDeep(currentDay),
      dayIndex: dayIndex,
      history: new History(dayIndex, timeline)
    }
  }

  componentDidMount() {
    this.props.loadData();
    this.props.fetchFirstDay();

    document.onkeydown = (e) => {
      if (e.key === 'Escape') {
        console.log('Refresh!');
        this.props.refresh();
      }
    }
  }

  render() {
    if (this.props.time.isLoading) {
      return <div>Loading...</div>;
    }
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
