const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const os = require('os');
const { connectDB } = require('./db/index');
const ErrorHandler = require('./middlewares/ErrorHandler');
const ApiV1Router = require('./routes/api/v1/index');
const { initializeSocket } = require('./socket');

const app = express();

dotenv.config();

app.use('/uploads', express.static('uploads'));
app.use(cors());
app.use(morgan('common'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up Swagger
require('./middlewares/swagger')(app);

// Add timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ error: true, message: 'Request timeout' });
  });
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/api/v1', ApiV1Router);

const PORT = process.env.PORT || 3000;

app.use(ErrorHandler);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connection established');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      const ip = getLocalIP();
      console.log(`Server is running on Link http://${ip}:${PORT}`);
    });

    // Initialize Socket.io
    initializeSocket(server);
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
