import express from 'express';
import { dbAll, dbGet, dbRun } from '../db.js';
import { authenticateToken } from './auth.js';
import { findResponsibleSachivalayam } from '../services/sachivalayamService.js';

const router = express.Router();

// List all Sachivalayams
router.get('/', async (req, res) => {
  try {
    const sachivalayams = await dbAll(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM complaints WHERE sachivalayam_id = s.id) as total_complaints,
              (SELECT COUNT(*) FROM complaints WHERE sachivalayam_id = s.id AND status = 'RESOLVED') as resolved_complaints,
              (SELECT COUNT(*) FROM complaints WHERE sachivalayam_id = s.id AND status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED')) as pending_complaints
       FROM sachivalayams s
       ORDER BY s.district, s.name`
    );
    res.json({ sachivalayams });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Sachivalayams' });
  }
});

// Lookup nearby / responsible Sachivalayam for coordinates
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters are required' });
    }

    const result = await findResponsibleSachivalayam(parseFloat(lat), parseFloat(lng));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to determine Sachivalayam authority' });
  }
});

// Get Sachivalayam details with official staff
router.get('/:id', async (req, res) => {
  try {
    const sachivalayam = await dbGet('SELECT * FROM sachivalayams WHERE id = ?', [req.params.id]);
    if (!sachivalayam) {
      return res.status(404).json({ error: 'Sachivalayam not found' });
    }

    const officials = await dbAll(
      "SELECT id, name, email, phone FROM users WHERE role = 'OFFICIAL' AND sachivalayam_id = ?",
      [sachivalayam.id]
    );

    const complaints = await dbAll(
      "SELECT * FROM complaints WHERE sachivalayam_id = ? ORDER BY created_at DESC",
      [sachivalayam.id]
    );

    res.json({ sachivalayam, officials, complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Sachivalayam details' });
  }
});

export default router;
