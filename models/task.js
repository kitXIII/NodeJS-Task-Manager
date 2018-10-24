module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: DataTypes.TEXT,
  }, {
    scopes: {
      taskStatus: {
        include: [
          { model: sequelize.TaskStatus, where: { id: this.taskStatusId } },
        ],
      },
    },
  });
  Task.associate = (models) => {
    Task.belongsTo(models.TaskStatuses, { foreignKey: 'taskStatusId' });
  };
  return Task;
};
