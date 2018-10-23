import formatDate from '../lib/formatDate';

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
  // taskStatus.associate = function(models) {
  //   // associations can be defined here
  // };
  return taskStatus;
};
