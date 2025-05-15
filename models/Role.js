module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    'Role',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'roles',
      timestamps: true,
    },
  );

  // Define associations
  Role.associate = (models) => {
    // A role can be assigned to many users
    Role.hasMany(models.User, {
      foreignKey: 'roleId',
      as: 'users',
    });
  };

  return Role;
};
