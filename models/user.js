import encrypt from '../lib/secure';
import formatDate from '../lib/formatDate';

export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: /^[a-zA-Z _]{3,}$/,
          msg: 'This field must contain at least 3 characters',
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
          args: /^(\w|[!@#$%^&*()+=<>?]){8,64}$/,
          msg: 'The password length should be more 8 characters',
        },
      },
    },
  }, {
    getterMethods: {
      fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
      created() {
        return formatDate(this.createdAt);
      },
      // associate(models) {
      //   // associations can be defined here
      // },
    },
  });
  return User;
};
