const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test route
app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint for handling form submissions
app.post('/submit-email', async (req, res) => {
  const { email } = req.body;

  try {
    const client = await pool.connect();
    await client.query('INSERT INTO emails (email) VALUES ($1)', [email]);
    client.release();
    res.status(200).send({ message: 'Email submitted successfully!' });
  } catch (error) {
    console.error('Error submitting email:', error);
    res.status(500).send({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});