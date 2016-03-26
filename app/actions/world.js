import fs from 'fs';
import _ from 'lodash';

export const LOAD_WORLD_DATA = 'LOAD_WORLD_DATA';
export const GET_HEX = 'GET_HEX';

export function loadData() {
  //let data = fs.readFileSync('/Users/kaelan/www/hexgen/bin/export3.json');
  let data = fs.readFileSync('/Users/kaelan/www/historia/bin/export.json');
  data = JSON.parse(data.toString());

  return {
    type: LOAD_WORLD_DATA,
    data
  };
}

export function getHex(x, y) {
  return (dispatch, getState) => {
    const { world } = getState();
    return {
      type: GET_HEX,
      data: world.hexes[x][y]
    };
  };
}
