import moment from 'moment';

export const PLAY = 'PLAY';
export const PAUSE = 'PAUSE';
export const PREV_DAY = 'PREV_DAY';
export const NEXT_DAY = 'NEXT_DAY';
export const SLOWER = 'SLOWER';
export const FASTER = 'FASTER';
export const FETCH_NEXT_DAY = 'FETCH_NEXT_DAY';
export const GO_TO_DAY = 'GO_TO_DAY';
export const IS_LOADING = 'IS_LOADING';
export const FETCH_FIRST_DAY = 'FETCH_FIRST_DAY';
export const LOAD_HISTORY = 'LOAD_HISTORY';

// how fast each time setting is
const SPEED_SECONDS = {
  1: 1500,
  2: 500,
  3: 150
};


// HELPERS

// fetch a new day from the server
export function fetchNextDay() {
  return fetch('http://localhost:5000/next_day')
    .then((res) => res.json());
}


// ACTIONS

export function loadHistory() {
  return (dispatch, getState) => {
    fetch('http://localhost:5000/start')
      .then(res => res.json())
      .then(data => {
        console.log('world data', data);
        dispatch({ type: LOAD_HISTORY, payload: data });
      });
  }
}

export function pause() {
  clearInterval(window.playInterval);
  return { type: PAUSE };
}

// go to the previous day
// it's always already loaded
export function previousDay() {
  return { type: PREV_DAY };
}

// go to the next day
// if we're at the last day loaded, fetch another day
export function nextDay() {
  return (dispatch, getState) => {
    const { time: {currentDay, lastFetchedDay} } = getState();
    if (currentDay.isSame(lastFetchedDay, 'day')) {
      dispatch({ type: IS_LOADING });
      fetchNextDay()
        .then(({ data, day }) => {
          dispatch({
            type: FETCH_NEXT_DAY,
            payload: { data, day }
          });
          dispatch({ type: NEXT_DAY });
        });
    } else {
      dispatch({ type: NEXT_DAY });
    }
  }
}

// go to a specific day
// only if it's already been loaded
export function goToDay(day) {
  return (dispatch, getState) => {
    const { time: { currentDay, lastFetchedDay } } = getState();
    if (currentDay.isBefore(lastFetchedDay, 'day')) {
      return { type: GO_TO_DAY, payload: day };
    } else {
      console.log("Can't jump into the future");
    }
  };
}

export function slower() {
  return { type: SLOWER };
}

export function faster() {
  return { type: FASTER };
}

export function goToFirstDay() {
  return goToDay(moment('0001-01-01'));
}

export function play() {
  return (dispatch, getState) => {
    dispatch({ type: PLAY });
    function step() {
      dispatch(nextDay());
      window.playInterval = setTimeout(step, SPEED_SECONDS[window.speed]);
    }
    step();
  };
}
