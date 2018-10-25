import _ from 'lodash';

const process = (items, selectedId, defaultId, values) => {
  const id = selectedId ? Number(selectedId) : Number(defaultId);
  return items
    .map(item => _.pick(item, values))
    .map(item => ((item.id === id) ? { ...item, selected: true } : item));
};

export default {
  status: (items, id) => process(items, id, 1, ['id', 'name']),
  user: (items, id, visibleField = 'fullName') => process(items, id, 0, ['id', visibleField])
    .map(item => _.mapKeys(item, (value, key) => (key === visibleField ? 'name' : key))),
};
