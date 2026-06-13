const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev simplicity
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
});

// Store io instance in express app for access in controllers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/stats', require('./routes/stats'));

// Root / Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'up', message: 'EcoConnect API is healthy' });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('EcoConnect API is running...');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

// Socket.io connection logic
io.on('connection', (socket) => {
  // Join user specific notification channel
  socket.on('joinUser', (userId) => {
    socket.join(userId);
  });

  // NGO users join a group channel to get listing broadcasts
  socket.on('joinNgos', () => {
    socket.join('ngos');
  });

  // Coordination rooms for chats
  socket.on('joinDonation', (donationId) => {
    socket.join(donationId);
  });

  socket.on('disconnect', () => {
    // handled implicitly by socket.io
  });
});

const PORT = process.env.PORT || 5000;

const serverInstance = server.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  serverInstance.close(() => process.exit(1));
});
