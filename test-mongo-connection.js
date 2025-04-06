const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI ? 'URI provided' : 'URI missing'}`);

// Connect to MongoDB with improved options
mongoose.connect(MONGODB_URI, {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB successfully');
  console.log('MongoDB connection state:', mongoose.connection.readyState);
  
  // Check if the database connection is established properly
  if (mongoose.connection.db) {
    console.log('Database connection established successfully');
    
    // Test connection by listing collections
    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        console.log('Collections in database:', collections.map(c => c.name).join(', '));
        mongoose.connection.close();
        console.log('Connection closed');
      })
      .catch(err => {
        console.error('Error listing collections:', err);
        mongoose.connection.close();
        process.exit(1);
      });
  } else {
    console.log('Database connection object not available yet');
    setTimeout(() => {
      if (mongoose.connection.db) {
        console.log('Database connection established after delay');
        mongoose.connection.db.listCollections().toArray()
          .then(collections => {
            console.log('Collections in database:', collections.map(c => c.name).join(', '));
            mongoose.connection.close();
            console.log('Connection closed');
          })
          .catch(err => {
            console.error('Error listing collections after delay:', err);
            mongoose.connection.close();
            process.exit(1);
          });
      } else {
        console.error('Database connection object still not available after delay');
        mongoose.connection.close();
        process.exit(1);
      }
    }, 2000);
  }
})
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
  console.error('MongoDB connection error details:', JSON.stringify(err, null, 2));
  process.exit(1);
});
