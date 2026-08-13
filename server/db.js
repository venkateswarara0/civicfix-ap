import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel, use /tmp folder for writable SQLite DB
const dbPath = process.env.VERCEL ? path.join('/tmp', 'civicfix.db') : path.join(__dirname, 'civicfix.db');

const db = new sqlite3.Database(dbPath);

// Promisified DB methods
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

export async function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // 1. Users table
        await dbRun(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'CITIZEN',
            phone TEXT,
            sachivalayam_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 2. Sachivalayams table
        await dbRun(`
          CREATE TABLE IF NOT EXISTS sachivalayams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            district TEXT NOT NULL,
            mandal TEXT NOT NULL,
            village TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            min_lat REAL,
            max_lat REAL,
            min_lng REAL,
            max_lng REAL,
            official_name TEXT,
            contact_phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 3. Complaints table
        await dbRun(`
          CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_id TEXT UNIQUE NOT NULL,
            citizen_id INTEGER NOT NULL,
            category_id TEXT NOT NULL,
            category_name TEXT NOT NULL,
            description TEXT NOT NULL,
            original_image_url TEXT NOT NULL,
            resolution_image_url TEXT,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            location_accuracy REAL,
            address TEXT,
            sachivalayam_id INTEGER,
            assigned_official_id INTEGER,
            priority TEXT DEFAULT 'MEDIUM',
            status TEXT DEFAULT 'SUBMITTED',
            resolution_remarks TEXT,
            upvotes_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME,
            reopened_at DATETIME,
            FOREIGN KEY (citizen_id) REFERENCES users(id),
            FOREIGN KEY (sachivalayam_id) REFERENCES sachivalayams(id)
          )
        `);

        // 4. Complaint status history table
        await dbRun(`
          CREATE TABLE IF NOT EXISTS complaint_status_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER NOT NULL,
            old_status TEXT,
            new_status TEXT NOT NULL,
            changed_by INTEGER,
            changed_by_name TEXT,
            remarks TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (complaint_id) REFERENCES complaints(id)
          )
        `);

        // 5. Notifications table
        await dbRun(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            complaint_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // 6. Upvotes table
        await dbRun(`
          CREATE TABLE IF NOT EXISTS complaint_upvotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(complaint_id, user_id)
          )
        `);

        // Seed database if empty
        await seedDatabase();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function seedDatabase() {
  const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0) {
    return; // Already seeded
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Sachivalayams
  const sachivalayams = [
    {
      name: 'Patamata Ward Sachivalayam 14',
      code: 'AP-VJA-PAT-014',
      district: 'NTR District',
      mandal: 'Vijayawada Urban',
      village: 'Patamata',
      lat: 16.4975,
      lng: 80.6552,
      min_lat: 16.480,
      max_lat: 16.510,
      min_lng: 80.640,
      max_lng: 80.670,
      official_name: 'K. Venkatesh (Ward Secretary)',
      contact_phone: '+91 98480 12345'
    },
    {
      name: 'Suryaraopet Grama Sachivalayam 08',
      code: 'AP-VJA-SUR-008',
      district: 'NTR District',
      mandal: 'Vijayawada Central',
      village: 'Suryaraopet',
      lat: 16.5105,
      lng: 80.6288,
      min_lat: 16.500,
      max_lat: 16.525,
      min_lng: 80.615,
      max_lng: 80.640,
      official_name: 'M. Lakshmi (Civic Welfare Officer)',
      contact_phone: '+91 98480 23456'
    },
    {
      name: 'Gajuwaka Ward Sachivalayam 03',
      code: 'AP-VSK-GAJ-003',
      district: 'Visakhapatnam',
      mandal: 'Gajuwaka',
      village: 'Gajuwaka Colony',
      lat: 17.6905,
      lng: 83.2185,
      min_lat: 17.670,
      max_lat: 17.710,
      min_lng: 83.190,
      max_lng: 83.240,
      official_name: 'R. Ramesh (Sanitation Secretary)',
      contact_phone: '+91 98480 34567'
    },
    {
      name: 'Brodipet Grama Sachivalayam 05',
      code: 'AP-GNT-BRO-005',
      district: 'Guntur',
      mandal: 'Guntur Urban',
      village: 'Brodipet',
      lat: 16.3067,
      lng: 80.4365,
      min_lat: 16.290,
      max_lat: 16.320,
      min_lng: 80.420,
      max_lng: 80.450,
      official_name: 'S. Nageswara Rao',
      contact_phone: '+91 98480 45678'
    },
    {
      name: 'Tirupati Town Ward Sachivalayam 02',
      code: 'AP-TPT-TWN-002',
      district: 'Tirupati',
      mandal: 'Tirupati Urban',
      village: 'KT Road',
      lat: 13.6288,
      lng: 79.4192,
      min_lat: 13.610,
      max_lat: 13.645,
      min_lng: 79.400,
      max_lng: 79.435,
      official_name: 'P. Anand Reddy',
      contact_phone: '+91 98480 56789'
    }
  ];

  for (const s of sachivalayams) {
    await dbRun(
      `INSERT INTO sachivalayams (name, code, district, mandal, village, lat, lng, min_lat, max_lat, min_lng, max_lng, official_name, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.name, s.code, s.district, s.mandal, s.village, s.lat, s.lng, s.min_lat, s.max_lat, s.min_lng, s.max_lng, s.official_name, s.contact_phone]
    );
  }

  // 2. Seed Users
  await dbRun(
    `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`,
    ['Ravi Kumar (Demo Citizen)', 'citizen@civicfix.in', passwordHash, 'CITIZEN', '+91 99887 76655']
  );

  await dbRun(
    `INSERT INTO users (name, email, password_hash, role, phone, sachivalayam_id) VALUES (?, ?, ?, ?, ?, ?)`,
    ['K. Venkatesh (Official)', 'official.patamata@civicfix.in', passwordHash, 'OFFICIAL', '+91 98480 12345', 1]
  );

  await dbRun(
    `INSERT INTO users (name, email, password_hash, role, phone, sachivalayam_id) VALUES (?, ?, ?, ?, ?, ?)`,
    ['M. Lakshmi (Official)', 'official.suryaraopet@civicfix.in', passwordHash, 'OFFICIAL', '+91 98480 23456', 2]
  );

  await dbRun(
    `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`,
    ['Admin Officer (AP Civic Portal)', 'admin@civicfix.in', passwordHash, 'ADMIN', '+91 90000 00000']
  );

  // 3. Seed Sample Complaints
  const sampleComplaints = [
    {
      tracking_id: 'CF-2026-08101',
      citizen_id: 1,
      category_id: 'pothole',
      category_name: 'Pothole / Road Damage',
      description: 'Deep hazardous pothole on MG Road near Benz Circle, creating severe risk for two-wheelers during monsoon rains.',
      original_image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80',
      resolution_image_url: 'https://images.unsplash.com/photo-1584463688353-27c19664f3ce?w=800&q=80',
      lat: 16.4982,
      lng: 80.6548,
      location_accuracy: 4.2,
      address: 'Near Benz Circle, MG Road, Patamata, Vijayawada, NTR District, AP - 520010',
      sachivalayam_id: 1,
      assigned_official_id: 2,
      priority: 'HIGH',
      status: 'RESOLVED',
      resolution_remarks: 'Pothole filled with cold asphalt mix, compacted with roller, and level inspected by Ward Engineering Officer.',
      created_at: '2026-08-10 09:30:00',
      resolved_at: '2026-08-11 14:15:00'
    },
    {
      tracking_id: 'CF-2026-08102',
      citizen_id: 1,
      category_id: 'garbage',
      category_name: 'Garbage Dumping',
      description: 'Overflowing commercial waste bin spilling onto sidewalk near Patamata High School, causing bad odor.',
      original_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80',
      resolution_image_url: null,
      lat: 16.4968,
      lng: 80.6560,
      location_accuracy: 5.0,
      address: 'Opposite High School, Main Road, Patamata, Vijayawada, NTR District, AP',
      sachivalayam_id: 1,
      assigned_official_id: 2,
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      resolution_remarks: null,
      created_at: '2026-08-12 11:00:00',
      resolved_at: null
    },
    {
      tracking_id: 'CF-2026-08103',
      citizen_id: 1,
      category_id: 'open_manhole',
      category_name: 'Open Manhole / Safety Hazard',
      description: 'Concrete manhole cover missing on residential street. Extremely dangerous at night!',
      original_image_url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80',
      resolution_image_url: null,
      lat: 16.5112,
      lng: 80.6295,
      location_accuracy: 3.5,
      address: 'Street 4, Suryaraopet, Vijayawada, NTR District, AP - 520002',
      sachivalayam_id: 2,
      assigned_official_id: 3,
      priority: 'CRITICAL',
      status: 'ASSIGNED',
      resolution_remarks: null,
      created_at: '2026-08-13 08:20:00',
      resolved_at: null
    },
    {
      tracking_id: 'CF-2026-08104',
      citizen_id: 1,
      category_id: 'streetlight',
      category_name: 'Broken Street Light',
      description: 'Three consecutive LED streetlights not functioning on Gajuwaka Main Road junction.',
      original_image_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&q=80',
      resolution_image_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800&q=80',
      lat: 17.6912,
      lng: 83.2190,
      location_accuracy: 6.0,
      address: 'Junction 2, Gajuwaka, Visakhapatnam, AP - 530026',
      sachivalayam_id: 3,
      assigned_official_id: null,
      priority: 'LOW',
      status: 'REOPENED',
      resolution_remarks: 'Replaced light bulbs',
      created_at: '2026-08-08 18:40:00',
      reopened_at: '2026-08-11 10:00:00'
    }
  ];

  for (const c of sampleComplaints) {
    const res = await dbRun(
      `INSERT INTO complaints 
      (tracking_id, citizen_id, category_id, category_name, description, original_image_url, resolution_image_url, lat, lng, location_accuracy, address, sachivalayam_id, assigned_official_id, priority, status, resolution_remarks, created_at, resolved_at, reopened_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.tracking_id,
        c.citizen_id,
        c.category_id,
        c.category_name,
        c.description,
        c.original_image_url,
        c.resolution_image_url,
        c.lat,
        c.lng,
        c.location_accuracy,
        c.address,
        c.sachivalayam_id,
        c.assigned_official_id,
        c.priority,
        c.status,
        c.resolution_remarks,
        c.created_at,
        c.resolved_at,
        c.reopened_at
      ]
    );

    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by_name, remarks, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [res.lastID, null, 'SUBMITTED', 'Ravi Kumar (Citizen)', 'Complaint submitted with GPS evidence.', c.created_at]
    );

    if (c.status === 'RESOLVED') {
      await dbRun(
        `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by_name, remarks, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [res.lastID, 'IN_PROGRESS', 'RESOLVED', 'K. Venkatesh (Official)', c.resolution_remarks, c.resolved_at]
      );
    } else if (c.status === 'REOPENED') {
      await dbRun(
        `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by_name, remarks, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [res.lastID, 'RESOLVED', 'REOPENED', 'Ravi Kumar (Citizen)', 'Street light stopped working again after 1 day.', c.reopened_at]
      );
    }
  }
}

export default db;
