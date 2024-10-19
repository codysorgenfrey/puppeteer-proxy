import express from 'express';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { suggest, proxy, metadata, weather } from './api/index.js';

dotenv.config(); // Load .env file for keys

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 8080;
const app = express();

// Handle GET requests for api endpoints
app.get('/api/weather', weather);
app.get('/api/suggest', suggest);
app.get('/api/proxy', proxy);
app.get('/api/metadata', metadata);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
