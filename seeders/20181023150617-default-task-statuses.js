module.exports = {
  up: queryInterface => queryInterface.bulkInsert('TaskStatuses', [
    { id: 1, name: 'New' },
    { id: 2, name: 'Assigned' },
    { id: 3, name: 'Testing' },
    { id: 4, name: 'Done' },
  ], {}),

  down: queryInterface => queryInterface.bulkDelete('TaskStatuses', null, {}),
};
