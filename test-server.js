const express = require('express');
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Simple root endpoint
app.get('/', (req, res) => {
  res.send('Backend service is running');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
