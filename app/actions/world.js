import fs from 'fs';
import _ from 'lodash';
import os from 'os';
import path from 'path';

export const LOAD_WORLD_DATA = 'LOAD_WORLD_DATA';
export const REFRESH_START = 'REFRESH_START';
export const REFRESH_END = 'REFRESH_END';


export function loadData() {
  // const fileLocation = path.join(os.homedir(), 'historia.json')
  // let data = fs.readFileSync(fileLocation);
  // data = JSON.parse(data.toString());
  return dispatch => {
    // if (localStorage.worldData) {
    //   const data = JSON.parse(localStorage.worldData)
    //   console.log('world data (cached)', data)
    //   dispatch({ type: LOAD_WORLD_DATA, data })
    // } else {
    fetch('http://localhost:5000/start')
      .then(res => res.json())
      .then(data => {
        console.log('world data', data);
        localStorage.worldData = JSON.stringify(data);
        dispatch({ type: LOAD_WORLD_DATA, payload: data });
      });
  }
}


export function refresh() {
  return dispatch => {
    dispatch({ type: REFRESH_START })
    fetch('http://localhost:5000/refresh')
      .then(res => res.json())
      .then(data => {
        localStorage.worldData = JSON.stringify(data)
        dispatch({ type: REFRESH_END, payload: data });
      });
  }
}
