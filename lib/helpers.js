import _ from 'lodash';

export const hasChanges = (incomingData, instance) => _.keys(incomingData)
  .reduce((acc, key) => (acc || incomingData[key] !== String(instance[key])), false);

export const getChanges = (incomingData, instance) => _.keys(incomingData)
  .filter(key => incomingData[key] !== String(instance[key]));

export const pickFormValues = (allowedFields, ctx) => {
  const { form: rawData } = ctx.request.body;
  const data = _.pick(rawData, allowedFields);
  return data;
};
