import _ from 'lodash';

const min = (a, b) => (a < b ? a : b);

const getMinMaxIndexes = (current, countOfPages, windowMaxSize) => {
  if (countOfPages <= windowMaxSize) {
    return { min: 1, max: countOfPages };
  }
  const center = Math.ceil(windowMaxSize / 2);
  if (current <= center) {
    return { min: 1, max: windowMaxSize };
  }
  return { min: current - center, max: min(current + center - 1, countOfPages) };
};

const partsGetters = [
  {
    condition: (current, countOfPages, windowMaxSize) => (countOfPages > windowMaxSize
      && current > Math.ceil(windowMaxSize / 2)),
    get: query => ({ text: '<<', query: { ...query, page: 1 } }),
  },
  {
    condition: (current, countOfPages, windowMaxSize) => (countOfPages > windowMaxSize
      && current > 1),
    get: (query, current) => ({ text: '<', query: { ...query, page: current - 1 } }),
  },
  {
    condition: () => true,
    get: (query, current, countOfPages, windowMaxSize) => {
      const indexes = getMinMaxIndexes(current, countOfPages, windowMaxSize);
      const items = [];
      for (let i = indexes.min; i <= indexes.max; i += 1) {
        items.push({ text: `${i}`, query: { ...query, page: i }, active: i === current });
      }
      return items;
    },
  },
  {
    condition: (current, countOfPages, windowMaxSize) => (countOfPages > windowMaxSize
      && current < countOfPages),
    get: (query, current) => ({ text: '>', query: { ...query, page: current + 1 } }),
  },
  {
    condition: (current, countOfPages, windowMaxSize) => (countOfPages > windowMaxSize
      && current < countOfPages - Math.floor(windowMaxSize / 2)),
    get: (query, current, countOfPages) => ({ text: '>>', query: { ...query, page: countOfPages } }),
  },
];

export default (current, countOfPages, query) => {
  const windowMaxSize = 5;
  return _.flatten(partsGetters.map(part => (part.condition(current, countOfPages, windowMaxSize)
    ? part.get(query, current, countOfPages, windowMaxSize)
    : null)).filter(part => part));
};
