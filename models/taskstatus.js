import formatDate from '../lib/dateFormatter';

module.exports = (sequelize, DataTypes) => {
  const taskStatus = sequelize.define('TaskStatus', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          args: true,
          msg: "This field can't be empty",
        },
      },
    },
  }, {
    getterMethods: {
      created() {
        return formatDate(this.createdAt);
      },
    },
  });

  return taskStatus;
};
