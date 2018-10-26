import _ from 'lodash';

export const hasChanges = (obj, orig) => _.keys(obj)
  .reduce((acc, key) => (acc || obj[key] !== String(orig[key])), false);

export const getChanges = (obj, orig) => _.keys(obj)
  .reduce((acc, key) => (obj[key] !== String(orig[key]) ? { ...acc, [key]: obj[key] } : acc), {});

export const pickFormValues = (allowedFields, ctx) => {
  const { form: rawData } = ctx.request.body;
  const data = _.pick(rawData, allowedFields);
  return data;
};
