import _ from 'lodash';

export default (page, pages, queryObj, size = 5) => {
  const isShort = length => length <= size;
  const offset = Math.ceil(size / 2);

  const getMinMaxIndexes = (current, length) => {
    if (isShort(length)) {
      return { min: 1, max: length };
    }
    if (current <= offset) {
      return { min: 1, max: size };
    }
    if (current - offset >= length - size) {
      return { min: length - size + 1, max: length };
    }
    return { min: current - offset + 1, max: current - offset + size };
  };

  const partsGetters = [
    {
      condition: (current, length) => (!isShort(length) && current > offset),
      get: query => ({ text: '<<', query: { ...query, page: 1 } }),
    },
    {
      condition: (current, length) => (!isShort(length) && current > 1),
      get: (query, current) => ({ text: '<', query: { ...query, page: current - 1 } }),
    },
    {
      condition: () => true,
      get: (query, current, length) => {
        const indexes = getMinMaxIndexes(current, length);
        const items = [];
        for (let i = indexes.min; i <= indexes.max; i += 1) {
          items.push({ text: `${i}`, query: { ...query, page: i }, active: i === current });
        }
        return items;
      },
    },
    {
      condition: (current, length) => (!isShort(length) && current < length),
      get: (query, current) => ({ text: '>', query: { ...query, page: current + 1 } }),
    },
    {
      condition: (current, length) => (!isShort(length) && current - offset < length - size),
      get: (query, current, length) => ({ text: '>>', query: { ...query, page: length } }),
    },
  ];

  return _.flatten(partsGetters
    .filter(part => part.condition(page, pages))
    .map(part => part.get(queryObj, page, pages)));
};
