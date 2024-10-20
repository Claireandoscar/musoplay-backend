const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Updated CORS configuration
app.use(cors({
  origin: ['https://www.musoplay.com', 'https://musoplay.com', 'http://www.musoplay.com', 'http://musoplay.com']
}));

app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} request to ${req.url}`);
  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/test', (req, res) => {
  console.log('Received request to /test endpoint');
  res.json({ message: 'Backend is working!' });
});

app.get('/test-db', async (req, res) => {
  console.log('Received request to /test-db endpoint');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database test successful');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/submit-email', async (req, res) => {
  console.log('Received request to /submit-email');
  console.log('Request body:', req.body);
  const { email } = req.body;

  if (!email) {
    console.log('No email provided in request');
    return res.status(400).send({ error: 'Email is required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('Invalid email format:', email);
    return res.status(400).send({ error: 'Invalid email format' });
  }

  console.log('Attempting to insert email:', email);

  try {
    const client = await pool.connect();
    console.log('Connected to database');
    
    const result = await client.query(
      'INSERT INTO waitlist_emails (email) VALUES ($1) RETURNING *',
      [email]
    );
    console.log('Query executed successfully');
    
    client.release();
    console.log('Database connection released');

    console.log('Email inserted successfully:', result.rows[0]);
    res.status(200).send({ message: 'Email submitted successfully!' });
  } catch (error) {
    console.error('Error submitting email:', error);
    if (error.code === '23505') { // Unique violation error code
      res.status(400).send({ error: 'This email has already been submitted.' });
    } else {
      res.status(500).send({ error: 'Database error', details: error.message });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});