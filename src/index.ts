import express from 'express';
import * as dotenv from 'dotenv';
import { proxy } from './api/index.js';

dotenv.config(); // Load .env file for keys

const port = process.env.PORT || 8080;
const app = express();

// Handle GET requests for api endpoints
app.get('/', proxy);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
