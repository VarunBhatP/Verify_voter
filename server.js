const app = require('./src/app');
const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const socketIo = require('socket.io');
const ChatMessage = require('./src/models/ChatMessage');

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 8080;
app.set('port', PORT);

// Add health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Create HTTP server
const server = http.createServer(app);

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;
console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI ? 'URI provided' : 'URI missing'}`);

// Set up Mongoose debug mode to log all operations
mongoose.set('debug', true);

// Set up Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Function to connect to MongoDB with retry mechanism
const connectWithRetry = async (retryCount = 0, maxRetries = 5) => {
  try {
    console.log(`MongoDB connection attempt ${retryCount + 1}/${maxRetries + 1}`);
    
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000
    });
    
    console.log('Connected to MongoDB successfully');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
    // Check if the database connection is established properly
    if (mongoose.connection.db) {
      console.log('Database connection established successfully');
      
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in database:', collections.map(c => c.name).join(', '));
        console.log('Static files being served from:', require('path').join(__dirname, 'public'));
        console.log('App environment:', process.env.NODE_ENV || 'development');
      } catch (error) {
        console.error('Error accessing collections:', error);
      }
    }
    
    return true;
  } catch (err) {
    console.error(`MongoDB connection attempt ${retryCount + 1} failed:`, err.message);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying connection in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectWithRetry(retryCount + 1, maxRetries);
    } else {
      console.error('Maximum retries reached. Could not connect to MongoDB.');
      console.error('MongoDB connection error details:', JSON.stringify(err, null, 2));
      throw err;
    }
  }
};

// Socket.io events
io.on('connection', (socket) => {
  // Join a room based on user ID
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    
    // Fetch previous messages for this room
    ChatMessage.find({ room: roomId })
      .sort({ createdAt: 1 })
      .limit(50)
      .then(messages => {
        // Emit previous messages to this specific client
        socket.emit('previousMessages', messages);
      })
      .catch(err => {
        console.error('Error fetching previous messages:', err);
        socket.emit('error', { message: 'Failed to fetch previous messages' });
      });
  });
  
  // Listen for new messages
  socket.on('chatMessage', async (messageData) => {
    try {
      const { userId, room, text, sender } = messageData;
      
      // Save message to database
      const newMessage = new ChatMessage({
        userId,
        room,
        text,
        sender
      });
      
      const savedMessage = await newMessage.save();
      
      // Broadcast message to the room
      io.to(room).emit('newMessage', savedMessage);
      
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected, socket ID:', socket.id);
  });
});

// Start server and connect to MongoDB
const startServer = async () => {
  try {
    // Start the server first so it can respond to health checks
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.syscall !== 'listen') {
        throw error;
      }
      
      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
      
      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
    
    // Connect to MongoDB with retry mechanism
    await connectWithRetry();
    console.log('Server is fully operational with database connection');
  } catch (error) {
    console.error('Failed to start server properly:', error);
    // We don't exit the process here to allow the health check to pass
    // But the application will log errors when trying to access the database
  }
};

// Start the server
startServer();