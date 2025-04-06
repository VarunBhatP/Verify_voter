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

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;
console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI ? 'URI provided' : 'URI missing'}`);

// Set up Mongoose debug mode to log all operations
mongoose.set('debug', true);

// Connect to MongoDB with improved options
mongoose.connect(MONGODB_URI, {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
.then(() => {
  console.log('Connected to MongoDB successfully');
  console.log('MongoDB connection state:', mongoose.connection.readyState);
  console.log('Available collections:', mongoose.connection.db ? 'DB accessible' : 'DB not accessible');
  
  // Test connection by listing collections
  mongoose.connection.db.listCollections().toArray()
    .then(collections => {
      console.log('Collections in database:', collections.map(c => c.name).join(', '));
    })
    .catch(err => {
      console.error('Error listing collections:', err);
    });
    
  startServer();
})
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
  console.error('MongoDB connection error details:', JSON.stringify(err, null, 2));
  console.error('Application will now exit due to database connection failure');
  process.exit(1);
});

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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

// Function to start the server
function startServer() {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}