import express from 'express';
import { dbAll, dbRun } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get My Notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await dbAll(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
      [req.user.id]
    );

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark Notification as Read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    await dbRun(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    res.json({ message: 'Marked notification as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;
