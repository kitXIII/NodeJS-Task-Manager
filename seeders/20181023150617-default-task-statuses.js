const date = new Date();

module.exports = {
  up: queryInterface => queryInterface.bulkInsert('TaskStatuses', [
    {
      id: 1,
      name: 'New',
      createdAt: date,
      updatedAt: date,
    },
    {
      id: 2,
      name: 'Assigned',
      createdAt: date,
      updatedAt: date,
    },
    {
      id: 3,
      name: 'Testing',
      createdAt: date,
      updatedAt: date,
    },
    {
      id: 4,
      name: 'Done',
      createdAt: date,
      updatedAt: date,
    },
  ], {}),

  down: queryInterface => queryInterface.bulkDelete('TaskStatuses', null, {}),
};
