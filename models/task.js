import Sequelize from 'sequelize';
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
    scopes: {
      filterByAssignedToId: id => ({
        where: {
          assignedToId: id,
        },
      }),
      filterByTaskStatusId: id => ({
        where: {
          taskStatusId: id,
        },
      }),
      filterByCreatorId: id => ({
        where: {
          creatorId: id,
        },
      }),
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
    Task.addScope('filterByTagsIds', ids => ({
      include: [
        {
          model: models.Tag,
          where: {
            id: {
              [Sequelize.Op.in]: ids,
            },
          },
        },
      ],
    }));
  };

  return Task;
};
