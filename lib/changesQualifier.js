import _ from 'lodash';

export default (incomingData, instance) => _.keys(incomingData)
  .reduce((acc, key) => (acc || incomingData[key] !== String(instance[key])), false);
