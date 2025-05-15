module.exports = (sequelize, DataTypes) => {
  const Otp = sequelize.define(
    'Otp',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      otp: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'otps',
      timestamps: true,
    },
  );

  Otp.associate = (models) => {
    Otp.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Otp;
};
