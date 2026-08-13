import express from 'express';
import { dbAll, dbGet, dbRun } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Middleware to ensure user is Admin
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Administrator privileges required' });
  }
}

// 1. Admin Analytics Dashboard Data
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalComplaints = await dbGet('SELECT COUNT(*) as count FROM complaints');
    const newComplaints = await dbGet("SELECT COUNT(*) as count FROM complaints WHERE status = 'SUBMITTED'");
    const inProgress = await dbGet("SELECT COUNT(*) as count FROM complaints WHERE status = 'IN_PROGRESS'");
    const resolved = await dbGet("SELECT COUNT(*) as count FROM complaints WHERE status = 'RESOLVED'");
    const reopened = await dbGet("SELECT COUNT(*) as count FROM complaints WHERE status = 'REOPENED'");
    const rejected = await dbGet("SELECT COUNT(*) as count FROM complaints WHERE status = 'REJECTED'");

    // Complaints by Category
    const byCategory = await dbAll(
      `SELECT category_name, category_id, COUNT(*) as count 
       FROM complaints 
       GROUP BY category_id 
       ORDER BY count DESC`
    );

    // Complaints by District / Sachivalayam Area
    const byArea = await dbAll(
      `SELECT s.district, s.village, COUNT(c.id) as count,
              SUM(CASE WHEN c.status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_count
       FROM complaints c
       JOIN sachivalayams s ON c.sachivalayam_id = s.id
       GROUP BY s.id
       ORDER BY count DESC`
    );

    // Problem Hotspots (locations with high density of complaints)
    const hotspots = await dbAll(
      `SELECT address, lat, lng, category_name, COUNT(*) as report_count, MAX(priority) as highest_priority
       FROM complaints
       GROUP BY ROUND(lat, 3), ROUND(lng, 3)
       ORDER BY report_count DESC
       LIMIT 10`
    );

    // Average resolution time in hours
    const avgResolutionRow = await dbGet(
      `SELECT AVG((JULIANDAY(resolved_at) - JULIANDAY(created_at)) * 24) as avg_hours
       FROM complaints
       WHERE status = 'RESOLVED' AND resolved_at IS NOT NULL`
    );

    res.json({
      metrics: {
        total: totalComplaints ? totalComplaints.count : 0,
        new: newComplaints ? newComplaints.count : 0,
        in_progress: inProgress ? inProgress.count : 0,
        resolved: resolved ? resolved.count : 0,
        reopened: reopened ? reopened.count : 0,
        rejected: rejected ? rejected.count : 0,
        avg_resolution_hours: avgResolutionRow && avgResolutionRow.avg_hours ? parseFloat(avgResolutionRow.avg_hours.toFixed(1)) : 24.0
      },
      byCategory,
      byArea,
      hotspots
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to compute admin analytics' });
  }
});

// 2. Re-assign Complaint to another Sachivalayam / Official
router.patch('/complaints/:id/reassign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sachivalayam_id, official_id, priority, remarks } = req.body;
    const complaintId = req.params.id;

    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    await dbRun(
      `UPDATE complaints 
       SET sachivalayam_id = ?, assigned_official_id = ?, priority = COALESCE(?, priority), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [sachivalayam_id, official_id || null, priority || null, complaintId]
    );

    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaintId, complaint.status, complaint.status, req.user.id, req.user.name, remarks || 'Reassigned by Administrator']
    );

    res.json({ message: 'Complaint successfully reassigned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reassign complaint' });
  }
});

// 3. Create New Sachivalayam Location
router.post('/sachivalayams', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, code, district, mandal, village, lat, lng, min_lat, max_lat, min_lng, max_lng, official_name, contact_phone } = req.body;

    if (!name || !code || !district || !mandal || !lat || !lng) {
      return res.status(400).json({ error: 'Missing required Sachivalayam details' });
    }

    const result = await dbRun(
      `INSERT INTO sachivalayams 
      (name, code, district, mandal, village, lat, lng, min_lat, max_lat, min_lng, max_lng, official_name, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, code, district, mandal, village || name, parseFloat(lat), parseFloat(lng), parseFloat(min_lat) || null, parseFloat(max_lat) || null, parseFloat(min_lng) || null, parseFloat(max_lng) || null, official_name || null, contact_phone || null]
    );

    res.status(201).json({ message: 'Sachivalayam created successfully', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Sachivalayam: ' + err.message });
  }
});

// 4. List All Users for Management
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await dbAll(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.sachivalayam_id, s.name as sachivalayam_name, u.created_at
       FROM users u
       LEFT JOIN sachivalayams s ON u.sachivalayam_id = s.id
       ORDER BY u.created_at DESC`
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user directory' });
  }
});

export default router;
