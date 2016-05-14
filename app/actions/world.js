import fs from 'fs';
import _ from 'lodash';
import os from 'os';
import path from 'path';

export const LOAD_WORLD_DATA = 'LOAD_WORLD_DATA';


export function loadData() {
  // const fileLocation = path.join(os.homedir(), 'historia.json')
  // let data = fs.readFileSync(fileLocation);
  // data = JSON.parse(data.toString());
  return (dispatch) => {
    if (localStorage.worldData) {
      const data = JSON.parse(localStorage.worldData)
      console.log('world data (cached)', data)
      dispatch({ type: LOAD_WORLD_DATA, data })
    } else {
      fetch('http://localhost:5000/world_data')
        .then(res => {
          res.json().then(data => {
            console.log('world data', data)
            localStorage.worldData = JSON.stringify(data)
            dispatch({ type: LOAD_WORLD_DATA, data })
          })
        })
    }
  }
}
