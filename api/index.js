import app from '../server/server.js';
import { initDb } from '../server/db.js';

let dbInitialized = false;

export default async function handler(req, res) {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (err) {
      console.error('Vercel serverless DB init error:', err);
    }
  }

  return app(req, res);
}
