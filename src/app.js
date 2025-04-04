const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - moved before API routes
app.use(express.static(path.join(__dirname, '../public')));

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const slotRoutes = require("./routes/timeSlotRoutes");
const adminRoutes = require("./routes/adminRoutes");
const digitalTokenRoutes = require("./routes/digitalTokenRoutes");
const expressRoutes = require("./routes/voterRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const faceVerificationRoutes = require("./routes/faceVerificationRoutes");

// Initialize face verification models
const { initModels } = require('./utils/faceVerification');
initModels().then(() => {
  console.log('Face verification models initialized successfully');
}).catch(err => {
  console.error('Error initializing face verification models:', err);
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/voter', expressRoutes);
app.use('/api/digital-token', digitalTokenRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/face', faceVerificationRoutes);

// Add backward compatibility routes
app.use('/admin', adminRoutes);
app.use('/api/timeslots', slotRoutes);
app.use('/timeslots', slotRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evoting', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
.then(() => {console.log('MongoDB connected in app.js')})
.catch(err => console.error('MongoDB connection error:', err));

// Default route
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Export the app
module.exports = app; 