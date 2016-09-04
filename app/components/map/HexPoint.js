import { Enum } from 'utils/enums';

const HexPoint = new Enum({
  NORTH: { value: 'North' },
  NORTH_EAST: { value: 'North East' },
  SOUTH_EAST: { value: 'south East' },
  SOUTH: { value: 'South' },
  SOUTH_WEST: { value: 'South West' },
  NORTH_WEST: { value: 'North West' }
});

export default HexPoint;
