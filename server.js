const express = require('express');
const cors = require('cors');

const app = express();

// Allow all origins
app.use(cors());

// Your routes and other middleware

app.listen(8000, () => {
  console.log('Server is running on port 8000');
});
