// db/index.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Load environment variables
dotenv.config();

// Initialize Sequelize with updated settings
const sequelize = new Sequelize(process.env.DB_NAME || 'webcom_db', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 60000, // Increase timeout
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
});

// Function to create database if it doesn't exist
const createDatabaseIfNotExists = async () => {
  try {
    console.log('Checking if database exists...');

    // Create a connection without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'webcom_db'}`);

    console.log(`✅ Database ${process.env.DB_NAME || 'webcom_db'} created or already exists`);

    // Close the connection
    await connection.end();
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    throw error;
  }
};

// Main database connection function with retry
const connectDB = async (retries = 5, delay = 2000) => {
  try {
    // First try to create the database if it doesn't exist
    await createDatabaseIfNotExists();

    // Then authenticate the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);

    if (retries > 0) {
      console.log(`Retrying connection in ${delay / 1000} seconds... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB(retries - 1, delay);
    }

    throw error;
  }
};

module.exports = { sequelize, connectDB: connectDB };
