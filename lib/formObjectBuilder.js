import _ from 'lodash';

export default (object, error = { errors: [] }, querystring = false) => ({
  name: 'form',
  object,
  errors: _.groupBy(error.errors, 'path'),
  querystring,
});
