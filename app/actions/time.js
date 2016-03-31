export const PLAY = 'PLAY';
export const PAUSE = 'PAUSE';
export const PREV_DAY = 'PREV_DAY';
export const NEXT_DAY = 'NEXT_DAY';
export const SLOWER = 'SLOWER';
export const FASTER = 'FASTER';
export const GET_DAY_DATA = 'GET_DAY_DATA';


const SPEED_SECONDS = {
  1: 1500,
  2: 500,
  3: 150
};

export function getDayData() {
  return (dispatch, getState) => {
    const { world } = getState();
    dispatch({
      type: GET_DAY_DATA,
      data: world
    });
  };
}

export function pause() {
  clearInterval(window.playInterval);
  return { type: PAUSE };
}

export function previousDay() {
  return (dispatch) => {
    dispatch({ type: PREV_DAY });
    dispatch(getDayData());
  };
}

export function nextDay() {
  return (dispatch) => {
    dispatch({ type: NEXT_DAY });
    dispatch(getDayData());
  };
}

export function slower() {
  return { type: SLOWER };
}

export function faster() {
  return { type: FASTER };
}


export function play() {
  return (dispatch) => {
    dispatch({ type: PLAY });
    function step() {
      dispatch(nextDay());
      dispatch(getDayData());
      window.playInterval = setTimeout(step, SPEED_SECONDS[window.speed]);
    }
    step();
  };
}
