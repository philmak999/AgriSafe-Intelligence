import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { investigate } from './agent.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/investigate', async (req, res) => {
  const { farmName } = req.body || {};
  if (!farmName || typeof farmName !== 'string') {
    return res.status(400).json({ error: 'farmName is required' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not set. Add a free key from console.groq.com to your .env file.',
    });
  }

  try {
    const result = await investigate(farmName);
    res.json(result);
  } catch (err) {
    console.error('investigate failed:', err);
    res.status(502).json({ error: err.message || 'Investigation failed' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`AgriSafe API server listening on http://localhost:${port}`);
});
