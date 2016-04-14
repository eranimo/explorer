import moment from 'moment';

export const DAY_FORMAT = 'YYYY-MM-DD';

export function convertToMoment(dateString) {
  return moment(dateString, DAY_FORMAT);
}

export function momentToDateString(momentDate) {
  return momentDate.format(DAY_FORMAT)
}
