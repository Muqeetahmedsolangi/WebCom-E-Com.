'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get a user ID and category IDs
    const users = await queryInterface.sequelize.query('SELECT id FROM users WHERE roleId = 1 LIMIT 1;', { type: Sequelize.QueryTypes.SELECT });

    const categories = await queryInterface.sequelize.query('SELECT id FROM categories LIMIT 5;', { type: Sequelize.QueryTypes.SELECT });

    if (users.length === 0 || categories.length === 0) {
      console.log('No users or categories found. Skipping product seeding.');
      return;
    }

    const userId = users[0].id;

    // Create products
    const products = [];

    // Product 1: Smartphone
    products.push({
      id: uuidv4(),
      userId: userId,
      categoryId: categories[0].id,
      name: 'Premium Smartphone X20',
      slug: 'premium-smartphone-x20',
      title: 'Latest Premium Smartphone X20 with Advanced Features',
      description:
        'Experience the next generation of smartphones with the X20. Featuring a stunning 6.7-inch OLED display, powerful octa-core processor, and an advanced camera system that takes professional-quality photos even in low light. With 256GB of storage and 12GB of RAM, multitasking and storage will never be an issue. The 5000mAh battery ensures all-day usage on a single charge.',
      shortDescription: 'Next-gen smartphone with advanced camera and all-day battery life.',
      price: 999.99,
      discountPrice: 899.99,
      quantity: 50,
      images: JSON.stringify(['uploads/products/smartphone-x20-1.jpg', 'uploads/products/smartphone-x20-2.jpg', 'uploads/products/smartphone-x20-3.jpg']),
      featured: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Product 2: Laptop
    products.push({
      id: uuidv4(),
      userId: userId,
      categoryId: categories[1].id,
      name: 'UltraBook Pro 15',
      slug: 'ultrabook-pro-15',
      title: 'UltraBook Pro 15 - Powerful and Lightweight Laptop',
      description:
        "The UltraBook Pro 15 combines exceptional performance with portability. Powered by the latest Intel Core i7 processor and featuring 16GB of fast DDR4 RAM, this laptop handles demanding applications with ease. The 15.6-inch 4K display provides stunning visuals for both work and entertainment. With 1TB SSD storage, you'll have plenty of space for all your files and applications.",
      shortDescription: 'High-performance laptop with 4K display and all-day battery life.',
      price: 1499.99,
      discountPrice: 1299.99,
      quantity: 30,
      images: JSON.stringify(['uploads/products/ultrabook-pro-1.jpg', 'uploads/products/ultrabook-pro-2.jpg', 'uploads/products/ultrabook-pro-3.jpg']),
      featured: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Product 3: Wireless Headphones
    products.push({
      id: uuidv4(),
      userId: userId,
      categoryId: categories[2].id,
      name: 'SoundWave Pro Headphones',
      slug: 'soundwave-pro-headphones',
      title: 'SoundWave Pro - Premium Noise Cancelling Wireless Headphones',
      description:
        'Immerse yourself in pure audio bliss with SoundWave Pro headphones. Industry-leading noise cancellation technology blocks out distractions, while the premium drivers deliver rich, detailed sound. With up to 30 hours of battery life and fast charging capability, these headphones are perfect for long trips.',
      shortDescription: 'Premium wireless headphones with active noise cancellation.',
      price: 349.99,
      discountPrice: 299.99,
      quantity: 100,
      images: JSON.stringify(['uploads/products/headphones-1.jpg', 'uploads/products/headphones-2.jpg', 'uploads/products/headphones-3.jpg']),
      featured: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Product 4: Smartwatch
    products.push({
      id: uuidv4(),
      userId: userId,
      categoryId: categories[3].id,
      name: 'FitTrack Smartwatch',
      slug: 'fittrack-smartwatch',
      title: 'FitTrack Smartwatch - Your Health and Fitness Companion',
      description:
        'Take control of your health and fitness with the FitTrack Smartwatch. This advanced wearable technology tracks your steps, heart rate, sleep patterns, and over 15 different exercise modes. The water-resistant design means you can wear it in any weather or even while swimming.',
      shortDescription: 'Advanced fitness tracker with long battery life and health monitoring.',
      price: 199.99,
      discountPrice: null,
      quantity: 75,
      images: JSON.stringify(['uploads/products/smartwatch-1.jpg', 'uploads/products/smartwatch-2.jpg']),
      featured: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Product 5: Portable Speaker
    products.push({
      id: uuidv4(),
      userId: userId,
      categoryId: categories[4].id,
      name: 'BassBoom Portable Speaker',
      slug: 'bassboom-portable-speaker',
      title: 'BassBoom Portable Speaker - Premium Sound Anywhere',
      description:
        "Take the party with you with the BassBoom Portable Speaker. Despite its compact size, this speaker delivers powerful, room-filling sound with deep bass. The waterproof design means you can use it at the beach or by the pool without worry. With 20 hours of playback time, the music won't stop until you want it to.",
      shortDescription: 'Waterproof portable speaker with powerful sound and long battery life.',
      price: 149.99,
      discountPrice: 129.99,
      quantity: 60,
      images: JSON.stringify(['uploads/products/speaker-1.jpg', 'uploads/products/speaker-2.jpg']),
      featured: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await queryInterface.bulkInsert('products', products);

    console.log(`Seeded ${products.length} products.`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('comments', null, {});
    await queryInterface.bulkDelete('products', null, {});
  },
};
