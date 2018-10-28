import formatDate from '../lib/dateFormatter';

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
    Task.belongsTo(models.User, { as: 'creator', foreignKey: 'creatorId' });
    Task.belongsTo(models.User, { as: 'assignedTo', foreignKey: 'assignedToId' });
    Task.belongsToMany(models.Tag, { through: 'TaskTags', foreignKey: 'taskId' });
    Task.addScope('full', {
      include: ['taskStatus', 'creator', 'assignedTo', 'Tags'],
    });
  };

  return Task;
};
