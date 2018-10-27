module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    name: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  }, {});
  Tag.associate = (models) => {
    Tag.belongsToMany(models.Task, { through: 'TaskTags', foreignKey: 'tagId' });
  };
  return Tag;
};
