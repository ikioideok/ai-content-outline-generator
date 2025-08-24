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

// API endpoint for streaming responses
app.post('/api/openai-stream', async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    // Cannot send a JSON error here as the client expects a stream.
    // The error will be handled on the client side by the connection closing.
    console.error('OPENAI_API_KEY is not set for streaming endpoint.');
    return res.status(500).end('Server configuration error.');
  }

  const { prompt, model } = req.body;

  if (!prompt || !model) {
    return res.status(400).end('Prompt and model are required.');
  }

  try {
    const stream = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
      stream: true,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(content);
      }
    }

    res.end();
  } catch (error) {
    console.error('Error calling OpenAI streaming API:', error.message);
    // The connection will likely be closed by the time we get here.
    // We try to end the response gracefully if it's still open.
    if (!res.headersSent) {
      res.status(500).end('Failed to call OpenAI API.');
    } else {
      res.end();
    }
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
