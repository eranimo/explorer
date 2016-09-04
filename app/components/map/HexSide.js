import { Enum } from 'utils/enums';
import HexPoint from './HexPoint';

const HexSide = new Enum({
  NORTH_EAST: {
    value: 'North East',
    fromPoint: HexPoint.NORTH,
    toPoint: HexPoint.NORTH_EAST
  },
  EAST: {
    value: 'East',
    fromPoint: HexPoint.NORTH_EAST,
    toPoint: HexPoint.SOUTH_EAST
  },
  SOUTH_EAST: {
    value: 'South East',
    fromPoint: HexPoint.SOUTH_EAST,
    toPoint: HexPoint.SOUTH
  },
  SOUTH_WEST: {
    value: 'South West',
    fromPoint: HexPoint.SOUTH,
    toPoint: HexPoint.SOUTH_WEST
  },
  WEST: {
    value: 'West',
    fromPoint: HexPoint.SOUTH_WEST,
    toPoint: HexPoint.NORTH_WEST
  },
  NORTH_WEST: {
    value: 'North West',
    fromPoint: HexPoint.NORTH_WEST,
    toPoint: HexPoint.NORTH
  },
});

export default HexSide;
