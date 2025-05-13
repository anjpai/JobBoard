// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://rpaianju15:7q7vkb9!iYY6nFQ@jobboard.f9hy8x8.mongodb.net/?retryWrites=true&w=majority&appName=JobBoard")
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/applications', require('./routes/application'));
app.use('/api/admin', require('./routes/admin'));

// Test route
app.get('/', (req, res) => res.send('Job Board API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));