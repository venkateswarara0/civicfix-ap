import express from 'express';
import multer from 'multer';
import { dbAll, dbGet, dbRun } from '../db.js';
import { authenticateToken } from './auth.js';
import { findResponsibleSachivalayam, calculateHaversineDistance } from '../services/sachivalayamService.js';
import { reverseGeocode } from '../services/addressService.js';

const router = express.Router();

// Memory Storage for 100% Serverless Cloud Compatibility
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Category display mapping
const CATEGORY_NAMES = {
  road: 'Road Damage',
  pothole: 'Pothole',
  garbage: 'Garbage Dumping',
  streetlight: 'Street Light Issue',
  water_leak: 'Water Leakage',
  drainage: 'Drainage Problem',
  open_manhole: 'Open Manhole',
  fallen_tree: 'Fallen Tree / Obstruction',
  traffic: 'Traffic / Safety Signboard',
  damaged_property: 'Damaged Public Property',
  sanitation: 'Sanitation Issue',
  electrical: 'Electrical Infrastructure',
  other: 'Other Civic Problem'
};

// Priority auto-detection helper
function detectDefaultPriority(category_id) {
  if (['open_manhole', 'electrical', 'traffic'].includes(category_id)) return 'CRITICAL';
  if (['pothole', 'drainage', 'water_leak'].includes(category_id)) return 'HIGH';
  if (['garbage', 'road', 'damaged_property'].includes(category_id)) return 'MEDIUM';
  return 'LOW';
}

// 1. Submit New Complaint
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { category_id, description, lat, lng, location_accuracy, custom_address } = req.body;

    if (!category_id || !description) {
      return res.status(400).json({ error: 'Category and description are required' });
    }

    let imageUrl = null;
    if (req.file) {
      const mime = req.file.mimetype || 'image/jpeg';
      const b64 = req.file.buffer.toString('base64');
      imageUrl = `data:${mime};base64,${b64}`;
    } else if (req.body.image_url) {
      imageUrl = req.body.image_url;
    } else {
      return res.status(400).json({ error: 'Photo evidence is required to report a problem' });
    }

    let latitude = parseFloat(lat);
    let longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Valid location coordinates are required' });
    }

    // Auto-detect and fix flipped coordinates (India Lat is 12-20, Lng is 76-85)
    if (latitude > 50 && longitude < 50) {
      const temp = latitude;
      latitude = longitude;
      longitude = temp;
    }

    // Auto-detect address if custom_address not provided
    const address = custom_address || (await reverseGeocode(latitude, longitude));

    // Auto-assign Sachivalayam
    const routingResult = await findResponsibleSachivalayam(latitude, longitude);

    const trackingId = 'CF-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const categoryName = CATEGORY_NAMES[category_id] || 'Civic Issue';
    const priority = detectDefaultPriority(category_id);

    const result = await dbRun(
      `INSERT INTO complaints 
      (tracking_id, citizen_id, category_id, category_name, description, original_image_url, lat, lng, location_accuracy, address, sachivalayam_id, assigned_official_id, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
      [
        trackingId,
        req.user.id,
        category_id,
        categoryName,
        description.trim(),
        imageUrl,
        latitude,
        longitude,
        parseFloat(location_accuracy) || 5.0,
        address,
        routingResult.sachivalayam_id,
        routingResult.assigned_official_id,
        priority
      ]
    );

    const complaintId = result.lastID;

    // Log initial status history
    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaintId, null, 'SUBMITTED', req.user.id, req.user.name, `Reported via app. Assigned to ${routingResult.sachivalayam_name}`]
    );

    // Notify Sachivalayam Official if assigned
    if (routingResult.assigned_official_id) {
      await dbRun(
        `INSERT INTO notifications (user_id, complaint_id, message) VALUES (?, ?, ?)`,
        [
          routingResult.assigned_official_id,
          complaintId,
          `New ${priority} priority complaint (${categoryName}) assigned to your Sachivalayam!`
        ]
      );
    }

    const createdComplaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [complaintId]);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: createdComplaint,
      assigned_sachivalayam: routingResult
    });
  } catch (err) {
    console.error('Submit complaint error:', err);
    res.status(500).json({ error: 'Failed to submit complaint: ' + err.message });
  }
});

// 2. Check Duplicate Nearby Complaints (within ~100m)
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, category_id } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters are required' });
    }

    let latitude = parseFloat(lat);
    let longitude = parseFloat(lng);

    if (latitude > 50 && longitude < 50) {
      const temp = latitude;
      latitude = longitude;
      longitude = temp;
    }

    const activeComplaints = await dbAll(
      `SELECT c.*, u.name as citizen_name, s.name as sachivalayam_name
       FROM complaints c
       LEFT JOIN users u ON c.citizen_id = u.id
       LEFT JOIN sachivalayams s ON c.sachivalayam_id = s.id
       WHERE c.status NOT IN ('RESOLVED', 'REJECTED')`
    );

    const duplicates = [];

    for (const comp of activeComplaints) {
      const distKm = calculateHaversineDistance(latitude, longitude, comp.lat, comp.lng);
      const distMeters = distKm * 1000;

      if (distMeters <= 150 && (!category_id || comp.category_id === category_id)) {
        duplicates.push({
          ...comp,
          distance_meters: Math.round(distMeters)
        });
      }
    }

    res.json({
      count: duplicates.length,
      duplicates: duplicates.sort((a, b) => a.distance_meters - b.distance_meters)
    });
  } catch (err) {
    console.error('Check nearby error:', err);
    res.status(500).json({ error: 'Failed to check nearby complaints' });
  }
});

// 3. Upvote/Support Existing Complaint
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user.id;

    const existing = await dbGet(
      'SELECT id FROM complaint_upvotes WHERE complaint_id = ? AND user_id = ?',
      [complaintId, userId]
    );

    if (existing) {
      return res.status(400).json({ error: 'You have already supported this complaint' });
    }

    await dbRun(
      'INSERT INTO complaint_upvotes (complaint_id, user_id) VALUES (?, ?)',
      [complaintId, userId]
    );

    await dbRun(
      'UPDATE complaints SET upvotes_count = upvotes_count + 1 WHERE id = ?',
      [complaintId]
    );

    const updated = await dbGet('SELECT upvotes_count FROM complaints WHERE id = ?', [complaintId]);

    res.json({
      message: 'Thank you for supporting this issue! Priority boosted.',
      upvotes_count: updated ? updated.upvotes_count : 1
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upvote complaint' });
  }
});

// 4. Get My Complaints (Citizen)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const complaints = await dbAll(
      `SELECT c.*, s.name as sachivalayam_name, s.code as sachivalayam_code
       FROM complaints c
       LEFT JOIN sachivalayams s ON c.sachivalayam_id = s.id
       WHERE c.citizen_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user complaints' });
  }
});

// 5. Get All Complaints
router.get('/', async (req, res) => {
  try {
    const { status, sachivalayam_id, priority, category_id, search } = req.query;

    let query = `
      SELECT c.*, u.name as citizen_name, u.phone as citizen_phone, s.name as sachivalayam_name, off.name as official_name
      FROM complaints c
      LEFT JOIN users u ON c.citizen_id = u.id
      LEFT JOIN sachivalayams s ON c.sachivalayam_id = s.id
      LEFT JOIN users off ON c.assigned_official_id = off.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (sachivalayam_id) {
      query += ` AND c.sachivalayam_id = ?`;
      params.push(sachivalayam_id);
    }

    if (priority) {
      query += ` AND c.priority = ?`;
      params.push(priority);
    }

    if (category_id) {
      query += ` AND c.category_id = ?`;
      params.push(category_id);
    }

    if (search) {
      query += ` AND (c.description LIKE ? OR c.tracking_id LIKE ? OR c.address LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY c.created_at DESC`;

    const complaints = await dbAll(query, params);
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// 6. Get Single Complaint Details with Status History
router.get('/:id', async (req, res) => {
  try {
    const complaint = await dbGet(
      `SELECT c.*, 
              u.name as citizen_name, u.phone as citizen_phone, u.email as citizen_email,
              s.name as sachivalayam_name, s.code as sachivalayam_code, s.district, s.mandal, s.village, s.official_name as sachivalayam_contact_person, s.contact_phone as sachivalayam_phone,
              off.name as official_name, off.phone as official_phone
       FROM complaints c
       LEFT JOIN users u ON c.citizen_id = u.id
       LEFT JOIN sachivalayams s ON c.sachivalayam_id = s.id
       LEFT JOIN users off ON c.assigned_official_id = off.id
       WHERE c.id = ? OR c.tracking_id = ?`,
      [req.params.id, req.params.id]
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const history = await dbAll(
      `SELECT * FROM complaint_status_history WHERE complaint_id = ? ORDER BY timestamp ASC`,
      [complaint.id]
    );

    res.json({ complaint, history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaint details' });
  }
});

// 7. Official Update Status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, remarks, priority } = req.body;
    const complaintId = req.params.id;

    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const oldStatus = complaint.status;
    const newPriority = priority || complaint.priority;

    await dbRun(
      `UPDATE complaints SET status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, newPriority, complaintId]
    );

    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaintId, oldStatus, status, req.user.id, req.user.name, remarks || `Status changed to ${status}`]
    );

    await dbRun(
      `INSERT INTO notifications (user_id, complaint_id, message) VALUES (?, ?, ?)`,
      [
        complaint.citizen_id,
        complaintId,
        `Your complaint #${complaint.tracking_id} status updated to ${status}.`
      ]
    );

    res.json({ message: 'Complaint status updated successfully', new_status: status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// 8. Official Resolve Complaint
router.post('/:id/resolve', authenticateToken, upload.single('resolution_image'), async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { remarks } = req.body;

    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    let resolutionImageUrl = null;
    if (req.file) {
      const mime = req.file.mimetype || 'image/jpeg';
      const b64 = req.file.buffer.toString('base64');
      resolutionImageUrl = `data:${mime};base64,${b64}`;
    } else if (req.body.resolution_image_url) {
      resolutionImageUrl = req.body.resolution_image_url;
    } else {
      return res.status(400).json({ error: 'Photo evidence of resolution is required!' });
    }

    const oldStatus = complaint.status;

    await dbRun(
      `UPDATE complaints 
       SET status = 'RESOLVED', resolution_image_url = ?, resolution_remarks = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [resolutionImageUrl, remarks || 'Issue successfully inspected and resolved on site.', complaintId]
    );

    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, remarks)
       VALUES (?, ?, 'RESOLVED', ?, ?, ?)`,
      [complaintId, oldStatus, req.user.id, req.user.name, remarks || 'Issue resolved and after photo uploaded.']
    );

    await dbRun(
      `INSERT INTO notifications (user_id, complaint_id, message) VALUES (?, ?, ?)`,
      [
        complaint.citizen_id,
        complaintId,
        `🎉 Good news! Your reported issue #${complaint.tracking_id} has been marked RESOLVED by Sachivalayam. Please inspect and confirm!`
      ]
    );

    res.json({
      message: 'Complaint marked as RESOLVED with proof of work!',
      resolution_image_url: resolutionImageUrl
    });
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ error: 'Failed to mark complaint resolved: ' + err.message });
  }
});

// 9. Citizen Confirm Resolution
router.post('/:id/confirm-resolution', authenticateToken, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { confirmed_solved, citizen_feedback } = req.body;

    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.citizen_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only the citizen who reported this issue can confirm resolution' });
    }

    if (confirmed_solved) {
      await dbRun(
        `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, remarks)
         VALUES (?, 'RESOLVED', 'RESOLVED', ?, ?, ?)`,
        [complaintId, req.user.id, req.user.name, `Citizen confirmed problem is SOLVED. Feedback: "${citizen_feedback || 'Satisfied'}"`]
      );

      return res.json({ message: 'Thank you for confirming! Problem officially closed.' });
    } else {
      const oldStatus = complaint.status;

      await dbRun(
        `UPDATE complaints SET status = 'REOPENED', reopened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [complaintId]
      );

      await dbRun(
        `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, changed_by_name, remarks)
         VALUES (?, ?, 'REOPENED', ?, ?, ?)`,
        [complaintId, oldStatus, req.user.id, req.user.name, `Citizen reported problem STILL PERSISTS: "${citizen_feedback || 'Issue not properly fixed'}"`]
      );

      if (complaint.assigned_official_id) {
        await dbRun(
          `INSERT INTO notifications (user_id, complaint_id, message) VALUES (?, ?, ?)`,
          [
            complaint.assigned_official_id,
            complaintId,
            `⚠️ Alert! Complaint #${complaint.tracking_id} was REOPENED by citizen: "${citizen_feedback || 'Not solved'}"`
          ]
        );
      }

      return res.json({ message: 'Complaint has been REOPENED and sent back to the Sachivalayam official for immediate re-inspection.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to process confirmation' });
  }
});

export default router;
