
const options = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timezone: 'UTC + 3',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
};

export default date => date.toLocaleString('en', options).replace(/(\d+\/)(\d+\/)/, '$2$1');
