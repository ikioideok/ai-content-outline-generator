const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
// Ensure you have OPENAI_API_KEY set in your environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set. Please set it in your .env file or environment variables.');
  // We don't exit here, to allow the frontend to be served,
  // but the API will not work.
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// API endpoint to proxy OpenAI requests
app.post('/api/openai', async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'The server is missing the OpenAI API key.' });
  }

  const { prompt, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (model !== 'gpt-5') {
      return res.status(400).json({ error: 'This endpoint currently only supports gpt-5' });
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
    });

    res.json({ content: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    res.status(500).json({ error: 'Failed to call OpenAI API', details: error.message });
  }
});

// Serve static files from the React app build directory
// This should be the directory where `npm run build` places the output.
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
