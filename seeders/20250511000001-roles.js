'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Clear the existing roles if any
    await queryInterface.bulkDelete('roles', null, {});

    // Insert two default roles
    return queryInterface.bulkInsert('roles', [
      {
        id: 1,
        name: 'admin',
        description: 'Administrator with full system access',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'user',
        description: 'Regular user with Shooping Cart and other access',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove inserted roles
    return queryInterface.bulkDelete('roles', null, {});
  },
};
