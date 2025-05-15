'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if the admin role exists
    const roles = await queryInterface.sequelize.query('SELECT id FROM roles WHERE name = "admin"', { type: queryInterface.sequelize.QueryTypes.SELECT });

    // If admin role doesn't exist, we can't create the admin user
    if (roles.length === 0) {
      console.error('Admin role not found. Please run the roles seeder first.');
      return;
    }

    const adminRoleId = roles[0].id;

    // Check if admin with this email already exists
    const existingAdmin = await queryInterface.sequelize.query('SELECT id FROM users WHERE email = "admin@gmail.com"', { type: queryInterface.sequelize.QueryTypes.SELECT });

    // Skip if admin already exists
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists, skipping seeder.');
      return;
    }

    // Create the admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    return queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        username: 'Muqeet Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        phone: '+923083160159',
        roleId: adminRoleId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove the admin user by email
    return queryInterface.bulkDelete('users', { email: 'admin@gmail.com' });
  },
};
