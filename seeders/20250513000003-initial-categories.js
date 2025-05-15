'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get the admin user ID
    const adminUsers = await queryInterface.sequelize.query('SELECT id FROM users WHERE email = "admin@gmail.com" LIMIT 1', { type: queryInterface.sequelize.QueryTypes.SELECT });

    if (adminUsers.length === 0) {
      console.error('Admin user not found. Please run the admin user seeder first.');
      return;
    }

    const adminId = adminUsers[0].id;

    // Sample categories
    const categories = [
      {
        id: uuidv4(),
        userId: adminId, // Added userId reference
        name: 'Shoes',
        slug: 'shoes',
        title: 'Shop Quality Shoes Online',
        description: 'Footwear of multiple brands including sports shoes, formal shoes, casual shoes, and more for men, women, and children.',
        image: 'categories/shoes.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        userId: adminId, // Added userId reference
        name: 'Clothing',
        slug: 'clothing',
        title: 'Fashion Clothing Collection',
        description: 'Apparel for men, women, and children including t-shirts, shirts, jeans, dresses, and more.',
        image: 'categories/clothing.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        userId: adminId, // Added userId reference
        name: 'Electronics',
        slug: 'electronics',
        title: 'Shop Electronics and Gadgets',
        description: 'Latest gadgets and electronic devices including smartphones, laptops, headphones, and more.',
        image: 'categories/electronics.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert categories
    await queryInterface.bulkInsert('categories', categories);
  },

  async down(queryInterface, Sequelize) {
    // Remove all seeded categories
    return queryInterface.bulkDelete('categories', null, {});
  },
};
