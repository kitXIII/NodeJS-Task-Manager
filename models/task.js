import formatDate from '../lib/formatDate';

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "This field can't be empty",
        },
      },
    },
    description: DataTypes.TEXT,
  }, {
    getterMethods: {
      created() {
        return formatDate(this.createdAt);
      },
      updated() {
        return formatDate(this.updatedAt);
      },
    },
  });

  Task.associate = (models) => {
    Task.belongsTo(models.TaskStatus, { as: 'taskStatus', foreignKey: 'taskStatusId' });
  };

  // Task.addScope('taskStatus', {
  //   include: [
  //     { model: sequelize.TaskStatus, where: { id: Task.taskStatusId } },
  //   ],
  // });

  return Task;
};
