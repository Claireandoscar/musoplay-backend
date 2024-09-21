const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Allow requests from the frontend

// Connect to the PostgreSQL database
const client = new Client({
  connectionString: process.env.DATABASE_URL, // Render will provide this
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

// Endpoint for handling form submissions
app.post('/submit-email', async (req, res) => {
  const { email } = req.body;

  try {
    await client.query('INSERT INTO emails (email) VALUES ($1)', [email]);
    res.status(200).send({ message: 'Email submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
