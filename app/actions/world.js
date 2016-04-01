import fs from 'fs';
import _ from 'lodash';

export const LOAD_WORLD_DATA = 'LOAD_WORLD_DATA';

export function loadData() {
  //let data = fs.readFileSync('/Users/kaelan/www/hexgen/bin/export3.json');
  let data = fs.readFileSync('/Users/kaelan/www/historia/bin/export.json');
  data = JSON.parse(data.toString());

  return {
    type: LOAD_WORLD_DATA,
    data
  };
}
