import fs from 'fs';
import _ from 'lodash';
import os from 'os';
import path from 'path';

export const LOAD_WORLD_DATA = 'LOAD_WORLD_DATA';

export function loadData() {
  const fileLocation = path.join(os.homedir(), 'historia.json')
  let data = fs.readFileSync(fileLocation);
  data = JSON.parse(data.toString());  

  return {
    type: LOAD_WORLD_DATA,
    data
  };
}
