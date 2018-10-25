import encrypt from '../lib/secure';
import formatDate from '../lib/dateFormatter';

export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: /^[a-zA-Z _]{1,}$/,
          msg: 'This field must contain at least 1 characters',
        },
      },
    },
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Email is not valid',
        },
      },
    },
    passwordDigest: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.VIRTUAL,
      set(value) {
        this.setDataValue('passwordDigest', encrypt(value));
        this.setDataValue('password', value);
        // return value;
      },
      validate: {
        is: {
          args: /^\S{8,64}$/,
          msg: 'The password length should be more 8 characters',
        },
      },
    },
  }, {
    getterMethods: {
      fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
      nameWithEmail() {
        return `${this.firstName} ${this.lastName} (${this.email})`;
      },
      created() {
        return formatDate(this.createdAt);
      },
    },
  });

  User.associate = (models) => {
    User.hasMany(models.Task, { as: 'InitializedTask', foreignKey: 'creatorId' });
    User.hasMany(models.Task, { as: 'Task', foreignKey: 'assignedToId' });
  };
  return User;
};
