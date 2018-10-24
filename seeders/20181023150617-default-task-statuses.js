module.exports = {
  up: queryInterface => queryInterface.bulkInsert('TaskStatuses', [
    { id: 1, name: 'New' },
    { name: 'Assigned' },
    { name: 'Testing' },
    { name: 'Done' },
  ], {}),

  down: queryInterface => queryInterface.bulkDelete('TaskStatuses', null, {}),
};
