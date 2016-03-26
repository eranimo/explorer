export const PLAY = 'PLAY';
export const PAUSE = 'PAUSE';
export const PREV_DAY = 'PREV_DAY';
export const NEXT_DAY = 'NEXT_DAY';
export const SLOWER = 'SLOWER';
export const FASTER = 'FASTER';
export const GET_DAY_DATA = 'GET_DAY_DATA';

export function play() {
  return { type: PLAY };
}

export function pause() {
  return { type: PAUSE };
}

export function previousDay() {
  return { type: PREV_DAY }
}

export function nextDay() {
  return { type: NEXT_DAY }
}

export function slower() {
  return { type: SLOWER }
}

export function faster() {
  return { type: FASTER }
}

export function getDayData() {
  return (dispatch, getState) => {
    const { world } = getState();
    dispatch({
      type: GET_DAY_DATA,
      data: world
    });
  };
}
