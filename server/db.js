import bcrypt from 'bcryptjs';

let dbInstance = null;
let useFallbackStore = false;

// In-Memory Data Store Fallback for Serverless Environments
const memoryStore = {
  users: [],
  sachivalayams: [],
  complaints: [],
  history: [],
  notifications: [],
  upvotes: [],
  userSeq: 1,
  sachivalayamSeq: 1,
  complaintSeq: 1,
  historySeq: 1,
  notificationSeq: 1,
  upvoteSeq: 1
};

export async function initDb() {
  if (dbInstance || useFallbackStore) return;

  try {
    const sqlite3Module = await import('sqlite3');
    const sqlite3 = sqlite3Module.default || sqlite3Module;
    const path = await import('path');

    const dbPath = process.env.VERCEL ? '/tmp/civicfix.db' : path.join(process.cwd(), 'server', 'civicfix.db');
    
    dbInstance = new sqlite3.Database(dbPath);

    await new Promise((resolve, reject) => {
      dbInstance.serialize(async () => {
        try {
          dbInstance.run(`
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

          dbInstance.run(`
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

          dbInstance.run(`
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
              reopened_at DATETIME
            )
          `);

          dbInstance.run(`
            CREATE TABLE IF NOT EXISTS complaint_status_history (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              complaint_id INTEGER NOT NULL,
              old_status TEXT,
              new_status TEXT NOT NULL,
              changed_by INTEGER,
              changed_by_name TEXT,
              remarks TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          dbInstance.run(`
            CREATE TABLE IF NOT EXISTS notifications (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              complaint_id INTEGER NOT NULL,
              message TEXT NOT NULL,
              is_read INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          dbInstance.run(`
            CREATE TABLE IF NOT EXISTS complaint_upvotes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              complaint_id INTEGER NOT NULL,
              user_id INTEGER NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(complaint_id, user_id)
            )
          `);

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    await seedSqliteDatabase();
  } catch (err) {
    console.warn('⚠️ Native SQLite unavailable on serverless platform. Activating In-Memory Database Store fallback:', err.message);
    useFallbackStore = true;
    await seedMemoryStore();
  }
}

// Promisified DB Query wrappers
export function dbRun(sql, params = []) {
  if (useFallbackStore) return runMemoryQuery(sql, params);

  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      return resolve(runMemoryQuery(sql, params));
    }
    dbInstance.run(sql, params, function (err) {
      if (err) {
        console.warn('SQL run error, falling back to memory store:', err.message);
        useFallbackStore = true;
        resolve(runMemoryQuery(sql, params));
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

export function dbGet(sql, params = []) {
  if (useFallbackStore) return getMemoryQuery(sql, params);

  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      return resolve(getMemoryQuery(sql, params));
    }
    dbInstance.get(sql, params, (err, row) => {
      if (err) {
        useFallbackStore = true;
        resolve(getMemoryQuery(sql, params));
      } else {
        resolve(row);
      }
    });
  });
}

export function dbAll(sql, params = []) {
  if (useFallbackStore) return allMemoryQuery(sql, params);

  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      return resolve(allMemoryQuery(sql, params));
    }
    dbInstance.all(sql, params, (err, rows) => {
      if (err) {
        useFallbackStore = true;
        resolve(allMemoryQuery(sql, params));
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Seed SQLite Database
async function seedSqliteDatabase() {
  const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0) return;

  const passwordHash = await bcrypt.hash('password123', 10);

  const sachivalayams = [
    { name: 'Patamata Ward Sachivalayam 14', code: 'AP-VJA-PAT-014', district: 'NTR District', mandal: 'Vijayawada Urban', village: 'Patamata', lat: 16.4975, lng: 80.6552, min_lat: 16.480, max_lat: 16.510, min_lng: 80.640, max_lng: 80.670, official_name: 'K. Venkatesh (Ward Secretary)', contact_phone: '+91 98480 12345' },
    { name: 'Suryaraopet Grama Sachivalayam 08', code: 'AP-VJA-SUR-008', district: 'NTR District', mandal: 'Vijayawada Central', village: 'Suryaraopet', lat: 16.5105, lng: 80.6288, min_lat: 16.500, max_lat: 16.525, min_lng: 80.615, max_lng: 80.640, official_name: 'M. Lakshmi (Civic Welfare Officer)', contact_phone: '+91 98480 23456' },
    { name: 'Gajuwaka Ward Sachivalayam 03', code: 'AP-VSK-GAJ-003', district: 'Visakhapatnam', mandal: 'Gajuwaka', village: 'Gajuwaka Colony', lat: 17.6905, lng: 83.2185, min_lat: 17.670, max_lat: 17.710, min_lng: 83.190, max_lng: 83.240, official_name: 'R. Ramesh (Sanitation Secretary)', contact_phone: '+91 98480 34567' },
    { name: 'Brodipet Grama Sachivalayam 05', code: 'AP-GNT-BRO-005', district: 'Guntur', mandal: 'Guntur Urban', village: 'Brodipet', lat: 16.3067, lng: 80.4365, min_lat: 16.290, max_lat: 16.320, min_lng: 80.420, max_lng: 80.450, official_name: 'S. Nageswara Rao', contact_phone: '+91 98480 45678' },
    { name: 'Tirupati Town Ward Sachivalayam 02', code: 'AP-TPT-TWN-002', district: 'Tirupati', mandal: 'Tirupati Urban', village: 'KT Road', lat: 13.6288, lng: 79.4192, min_lat: 13.610, max_lat: 13.645, min_lng: 79.400, max_lng: 79.435, official_name: 'P. Anand Reddy', contact_phone: '+91 98480 56789' }
  ];

  for (const s of sachivalayams) {
    await dbRun(
      `INSERT INTO sachivalayams (name, code, district, mandal, village, lat, lng, min_lat, max_lat, min_lng, max_lng, official_name, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.name, s.code, s.district, s.mandal, s.village, s.lat, s.lng, s.min_lat, s.max_lat, s.min_lng, s.max_lng, s.official_name, s.contact_phone]
    );
  }

  await dbRun(`INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`, ['Ravi Kumar (Demo Citizen)', 'citizen@civicfix.in', passwordHash, 'CITIZEN', '+91 99887 76655']);
  await dbRun(`INSERT INTO users (name, email, password_hash, role, phone, sachivalayam_id) VALUES (?, ?, ?, ?, ?, ?)`, ['K. Venkatesh (Official)', 'official.patamata@civicfix.in', passwordHash, 'OFFICIAL', '+91 98480 12345', 1]);
  await dbRun(`INSERT INTO users (name, email, password_hash, role, phone, sachivalayam_id) VALUES (?, ?, ?, ?, ?, ?)`, ['M. Lakshmi (Official)', 'official.suryaraopet@civicfix.in', passwordHash, 'OFFICIAL', '+91 98480 23456', 2]);
  await dbRun(`INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`, ['Admin Officer (AP Civic Portal)', 'admin@civicfix.in', passwordHash, 'ADMIN', '+91 90000 00000']);

  const sampleComplaints = [
    { tracking_id: 'CF-2026-08101', citizen_id: 1, category_id: 'pothole', category_name: 'Pothole / Road Damage', description: 'Deep hazardous pothole on MG Road near Benz Circle, creating severe risk for two-wheelers during monsoon rains.', original_image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80', resolution_image_url: 'https://images.unsplash.com/photo-1584463688353-27c19664f3ce?w=800&q=80', lat: 16.4982, lng: 80.6548, location_accuracy: 4.2, address: 'Near Benz Circle, MG Road, Patamata, Vijayawada, NTR District, AP - 520010', sachivalayam_id: 1, assigned_official_id: 2, priority: 'HIGH', status: 'RESOLVED', resolution_remarks: 'Pothole filled with cold asphalt mix, compacted with roller, and level inspected by Ward Engineering Officer.', created_at: '2026-08-10 09:30:00', resolved_at: '2026-08-11 14:15:00' },
    { tracking_id: 'CF-2026-08102', citizen_id: 1, category_id: 'garbage', category_name: 'Garbage Dumping', description: 'Overflowing commercial waste bin spilling onto sidewalk near Patamata High School, causing bad odor.', original_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80', resolution_image_url: null, lat: 16.4968, lng: 80.6560, location_accuracy: 5.0, address: 'Opposite High School, Main Road, Patamata, Vijayawada, NTR District, AP', sachivalayam_id: 1, assigned_official_id: 2, priority: 'MEDIUM', status: 'IN_PROGRESS', resolution_remarks: null, created_at: '2026-08-12 11:00:00', resolved_at: null },
    { tracking_id: 'CF-2026-08103', citizen_id: 1, category_id: 'open_manhole', category_name: 'Open Manhole / Safety Hazard', description: 'Concrete manhole cover missing on residential street. Extremely dangerous at night!', original_image_url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80', resolution_image_url: null, lat: 16.5112, lng: 80.6295, location_accuracy: 3.5, address: 'Street 4, Suryaraopet, Vijayawada, NTR District, AP - 520002', sachivalayam_id: 2, assigned_official_id: 3, priority: 'CRITICAL', status: 'ASSIGNED', resolution_remarks: null, created_at: '2026-08-13 08:20:00', resolved_at: null },
    { tracking_id: 'CF-2026-08104', citizen_id: 1, category_id: 'streetlight', category_name: 'Broken Street Light', description: 'Three consecutive LED streetlights not functioning on Gajuwaka Main Road junction.', original_image_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&q=80', resolution_image_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800&q=80', lat: 17.6912, lng: 83.2190, location_accuracy: 6.0, address: 'Junction 2, Gajuwaka, Visakhapatnam, AP - 530026', sachivalayam_id: 3, assigned_official_id: null, priority: 'LOW', status: 'REOPENED', resolution_remarks: 'Replaced light bulbs', created_at: '2026-08-08 18:40:00', reopened_at: '2026-08-11 10:00:00' }
  ];

  for (const c of sampleComplaints) {
    const res = await dbRun(
      `INSERT INTO complaints (tracking_id, citizen_id, category_id, category_name, description, original_image_url, resolution_image_url, lat, lng, location_accuracy, address, sachivalayam_id, assigned_official_id, priority, status, resolution_remarks, created_at, resolved_at, reopened_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.tracking_id, c.citizen_id, c.category_id, c.category_name, c.description, c.original_image_url, c.resolution_image_url, c.lat, c.lng, c.location_accuracy, c.address, c.sachivalayam_id, c.assigned_official_id, c.priority, c.status, c.resolution_remarks, c.created_at, c.resolved_at, c.reopened_at]
    );

    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by_name, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [res.lastID, null, 'SUBMITTED', 'Ravi Kumar (Citizen)', 'Complaint submitted with GPS evidence.', c.created_at]
    );
  }
}

// Seed In-Memory Store
async function seedMemoryStore() {
  if (memoryStore.users.length > 0) return;

  const passwordHash = await bcrypt.hash('password123', 10);

  memoryStore.sachivalayams = [
    { id: 1, name: 'Patamata Ward Sachivalayam 14', code: 'AP-VJA-PAT-014', district: 'NTR District', mandal: 'Vijayawada Urban', village: 'Patamata', lat: 16.4975, lng: 80.6552, min_lat: 16.480, max_lat: 16.510, min_lng: 80.640, max_lng: 80.670, official_name: 'K. Venkatesh (Ward Secretary)', contact_phone: '+91 98480 12345' },
    { id: 2, name: 'Suryaraopet Grama Sachivalayam 08', code: 'AP-VJA-SUR-008', district: 'NTR District', mandal: 'Vijayawada Central', village: 'Suryaraopet', lat: 16.5105, lng: 80.6288, min_lat: 16.500, max_lat: 16.525, min_lng: 80.615, max_lng: 80.640, official_name: 'M. Lakshmi (Civic Welfare Officer)', contact_phone: '+91 98480 23456' },
    { id: 3, name: 'Gajuwaka Ward Sachivalayam 03', code: 'AP-VSK-GAJ-003', district: 'Visakhapatnam', mandal: 'Gajuwaka', village: 'Gajuwaka Colony', lat: 17.6905, lng: 83.2185, min_lat: 17.670, max_lat: 17.710, min_lng: 83.190, max_lng: 83.240, official_name: 'R. Ramesh (Sanitation Secretary)', contact_phone: '+91 98480 34567' },
    { id: 4, name: 'Brodipet Grama Sachivalayam 05', code: 'AP-GNT-BRO-005', district: 'Guntur', mandal: 'Guntur Urban', village: 'Brodipet', lat: 16.3067, lng: 80.4365, min_lat: 16.290, max_lat: 16.320, min_lng: 80.420, max_lng: 80.450, official_name: 'S. Nageswara Rao', contact_phone: '+91 98480 45678' },
    { id: 5, name: 'Tirupati Town Ward Sachivalayam 02', code: 'AP-TPT-TWN-002', district: 'Tirupati', mandal: 'Tirupati Urban', village: 'KT Road', lat: 13.6288, lng: 79.4192, min_lat: 13.610, max_lat: 13.645, min_lng: 79.400, max_lng: 79.435, official_name: 'P. Anand Reddy', contact_phone: '+91 98480 56789' }
  ];
  memoryStore.sachivalayamSeq = 6;

  memoryStore.users = [
    { id: 1, name: 'Ravi Kumar (Demo Citizen)', email: 'citizen@civicfix.in', password_hash: passwordHash, role: 'CITIZEN', phone: '+91 99887 76655', sachivalayam_id: null },
    { id: 2, name: 'K. Venkatesh (Official)', email: 'official.patamata@civicfix.in', password_hash: passwordHash, role: 'OFFICIAL', phone: '+91 98480 12345', sachivalayam_id: 1 },
    { id: 3, name: 'M. Lakshmi (Official)', email: 'official.suryaraopet@civicfix.in', password_hash: passwordHash, role: 'OFFICIAL', phone: '+91 98480 23456', sachivalayam_id: 2 },
    { id: 4, name: 'Admin Officer (AP Civic Portal)', email: 'admin@civicfix.in', password_hash: passwordHash, role: 'ADMIN', phone: '+91 90000 00000', sachivalayam_id: null }
  ];
  memoryStore.userSeq = 5;

  memoryStore.complaints = [
    { id: 1, tracking_id: 'CF-2026-08101', citizen_id: 1, category_id: 'pothole', category_name: 'Pothole / Road Damage', description: 'Deep hazardous pothole on MG Road near Benz Circle, creating severe risk for two-wheelers during monsoon rains.', original_image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80', resolution_image_url: 'https://images.unsplash.com/photo-1584463688353-27c19664f3ce?w=800&q=80', lat: 16.4982, lng: 80.6548, location_accuracy: 4.2, address: 'Near Benz Circle, MG Road, Patamata, Vijayawada, NTR District, AP - 520010', sachivalayam_id: 1, assigned_official_id: 2, priority: 'HIGH', status: 'RESOLVED', resolution_remarks: 'Pothole filled with cold asphalt mix, compacted with roller, and level inspected by Ward Engineering Officer.', upvotes_count: 3, created_at: '2026-08-10 09:30:00', resolved_at: '2026-08-11 14:15:00' },
    { id: 2, tracking_id: 'CF-2026-08102', citizen_id: 1, category_id: 'garbage', category_name: 'Garbage Dumping', description: 'Overflowing commercial waste bin spilling onto sidewalk near Patamata High School, causing bad odor.', original_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80', resolution_image_url: null, lat: 16.4968, lng: 80.6560, location_accuracy: 5.0, address: 'Opposite High School, Main Road, Patamata, Vijayawada, NTR District, AP', sachivalayam_id: 1, assigned_official_id: 2, priority: 'MEDIUM', status: 'IN_PROGRESS', resolution_remarks: null, upvotes_count: 1, created_at: '2026-08-12 11:00:00', resolved_at: null },
    { id: 3, tracking_id: 'CF-2026-08103', citizen_id: 1, category_id: 'open_manhole', category_name: 'Open Manhole / Safety Hazard', description: 'Concrete manhole cover missing on residential street. Extremely dangerous at night!', original_image_url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80', resolution_image_url: null, lat: 16.5112, lng: 80.6295, location_accuracy: 3.5, address: 'Street 4, Suryaraopet, Vijayawada, NTR District, AP - 520002', sachivalayam_id: 2, assigned_official_id: 3, priority: 'CRITICAL', status: 'ASSIGNED', resolution_remarks: null, upvotes_count: 5, created_at: '2026-08-13 08:20:00', resolved_at: null },
    { id: 4, tracking_id: 'CF-2026-08104', citizen_id: 1, category_id: 'streetlight', category_name: 'Broken Street Light', description: 'Three consecutive LED streetlights not functioning on Gajuwaka Main Road junction.', original_image_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&q=80', resolution_image_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800&q=80', lat: 17.6912, lng: 83.2190, location_accuracy: 6.0, address: 'Junction 2, Gajuwaka, Visakhapatnam, AP - 530026', sachivalayam_id: 3, assigned_official_id: null, priority: 'LOW', status: 'REOPENED', resolution_remarks: 'Replaced light bulbs', upvotes_count: 2, created_at: '2026-08-08 18:40:00', reopened_at: '2026-08-11 10:00:00' }
  ];
  memoryStore.complaintSeq = 5;

  memoryStore.history = [
    { id: 1, complaint_id: 1, old_status: null, new_status: 'SUBMITTED', changed_by: 1, changed_by_name: 'Ravi Kumar (Citizen)', remarks: 'Complaint submitted with GPS evidence.', timestamp: '2026-08-10 09:30:00' },
    { id: 2, complaint_id: 1, old_status: 'IN_PROGRESS', new_status: 'RESOLVED', changed_by: 2, changed_by_name: 'K. Venkatesh (Official)', remarks: 'Pothole filled with cold asphalt mix.', timestamp: '2026-08-11 14:15:00' }
  ];
  memoryStore.historySeq = 3;
}

// In-Memory Query Parsers
function runMemoryQuery(sql, params) {
  const sqlTrim = sql.trim();

  // Users INSERT
  if (sqlTrim.startsWith('INSERT INTO users')) {
    const user = {
      id: memoryStore.userSeq++,
      name: params[0],
      email: params[1],
      password_hash: params[2],
      role: params[3] || 'CITIZEN',
      phone: params[4] || null,
      sachivalayam_id: params[5] || null,
      created_at: new Date().toISOString()
    };
    memoryStore.users.push(user);
    return { lastID: user.id, changes: 1 };
  }

  // Sachivalayams INSERT
  if (sqlTrim.startsWith('INSERT INTO sachivalayams')) {
    const sach = {
      id: memoryStore.sachivalayamSeq++,
      name: params[0],
      code: params[1],
      district: params[2],
      mandal: params[3],
      village: params[4],
      lat: params[5],
      lng: params[6],
      min_lat: params[7],
      max_lat: params[8],
      min_lng: params[9],
      max_lng: params[10],
      official_name: params[11],
      contact_phone: params[12]
    };
    memoryStore.sachivalayams.push(sach);
    return { lastID: sach.id, changes: 1 };
  }

  // Complaints INSERT
  if (sqlTrim.startsWith('INSERT INTO complaints')) {
    const comp = {
      id: memoryStore.complaintSeq++,
      tracking_id: params[0],
      citizen_id: params[1],
      category_id: params[2],
      category_name: params[3],
      description: params[4],
      original_image_url: params[5],
      resolution_image_url: params[6] || null,
      lat: params[7],
      lng: params[8],
      location_accuracy: params[9] || 5.0,
      address: params[10] || 'Andhra Pradesh',
      sachivalayam_id: params[11] || 1,
      assigned_official_id: params[12] || 2,
      priority: params[13] || 'MEDIUM',
      status: params[14] || 'SUBMITTED',
      resolution_remarks: params[15] || null,
      upvotes_count: 0,
      created_at: params[16] || new Date().toISOString()
    };
    memoryStore.complaints.push(comp);
    return { lastID: comp.id, changes: 1 };
  }

  // History INSERT
  if (sqlTrim.startsWith('INSERT INTO complaint_status_history')) {
    const h = {
      id: memoryStore.historySeq++,
      complaint_id: params[0],
      old_status: params[1],
      new_status: params[2],
      changed_by: params[3],
      changed_by_name: params[4],
      remarks: params[5],
      timestamp: params[6] || new Date().toISOString()
    };
    memoryStore.history.push(h);
    return { lastID: h.id, changes: 1 };
  }

  // Notifications INSERT
  if (sqlTrim.startsWith('INSERT INTO notifications')) {
    const n = {
      id: memoryStore.notificationSeq++,
      user_id: params[0],
      complaint_id: params[1],
      message: params[2],
      is_read: 0,
      created_at: new Date().toISOString()
    };
    memoryStore.notifications.push(n);
    return { lastID: n.id, changes: 1 };
  }

  // Upvotes INSERT
  if (sqlTrim.startsWith('INSERT INTO complaint_upvotes')) {
    const u = {
      id: memoryStore.upvoteSeq++,
      complaint_id: params[0],
      user_id: params[1],
      created_at: new Date().toISOString()
    };
    memoryStore.upvotes.push(u);
    return { lastID: u.id, changes: 1 };
  }

  // Updates
  if (sqlTrim.startsWith('UPDATE complaints')) {
    const id = params[params.length - 1];
    const comp = memoryStore.complaints.find(c => c.id == id);
    if (comp) {
      if (sqlTrim.includes('status = ?')) comp.status = params[0];
      if (sqlTrim.includes('resolution_image_url = ?')) {
        comp.resolution_image_url = params[0];
        comp.resolution_remarks = params[1];
      }
      if (sqlTrim.includes('upvotes_count = upvotes_count + 1')) comp.upvotes_count = (comp.upvotes_count || 0) + 1;
    }
    return { changes: 1 };
  }

  return { lastID: 1, changes: 1 };
}

function getMemoryQuery(sql, params) {
  const sqlTrim = sql.trim();

  if (sqlTrim.includes('FROM users WHERE email = ?')) {
    return memoryStore.users.find(u => u.email.toLowerCase() === String(params[0]).toLowerCase()) || null;
  }
  if (sqlTrim.includes('FROM users WHERE id = ?')) {
    return memoryStore.users.find(u => u.id == params[0]) || null;
  }
  if (sqlTrim.includes('FROM users WHERE role = \'OFFICIAL\'')) {
    return memoryStore.users.find(u => u.role === 'OFFICIAL' && u.sachivalayam_id == params[0]) || memoryStore.users.find(u => u.role === 'OFFICIAL');
  }
  if (sqlTrim.includes('FROM sachivalayams WHERE id = ?')) {
    return memoryStore.sachivalayams.find(s => s.id == params[0]) || null;
  }
  if (sqlTrim.includes('FROM complaints WHERE id = ?')) {
    const c = memoryStore.complaints.find(comp => comp.id == params[0] || comp.tracking_id == params[0]);
    if (!c) return null;
    const citizen = memoryStore.users.find(u => u.id == c.citizen_id);
    const sach = memoryStore.sachivalayams.find(s => s.id == c.sachivalayam_id);
    const official = memoryStore.users.find(u => u.id == c.assigned_official_id);
    return {
      ...c,
      citizen_name: citizen?.name || 'Ravi Kumar',
      citizen_phone: citizen?.phone || '+91 99887 76655',
      sachivalayam_name: sach?.name || 'Patamata Ward Sachivalayam 14',
      sachivalayam_code: sach?.code || 'AP-VJA-PAT-014',
      district: sach?.district || 'NTR District',
      mandal: sach?.mandal || 'Vijayawada Urban',
      village: sach?.village || 'Patamata',
      official_name: official?.name || 'K. Venkatesh'
    };
  }
  if (sqlTrim.includes('COUNT(*) as count FROM users')) {
    return { count: memoryStore.users.length };
  }
  if (sqlTrim.includes('COUNT(*) as count FROM complaints')) {
    return { count: memoryStore.complaints.length };
  }

  return null;
}

function allMemoryQuery(sql, params) {
  const sqlTrim = sql.trim();

  if (sqlTrim.includes('FROM sachivalayams')) {
    return memoryStore.sachivalayams.map(s => ({
      ...s,
      total_complaints: memoryStore.complaints.filter(c => c.sachivalayam_id == s.id).length,
      resolved_complaints: memoryStore.complaints.filter(c => c.sachivalayam_id == s.id && c.status === 'RESOLVED').length,
      pending_complaints: memoryStore.complaints.filter(c => c.sachivalayam_id == s.id && c.status !== 'RESOLVED').length
    }));
  }
  if (sqlTrim.includes('FROM complaints')) {
    return memoryStore.complaints.map(c => {
      const citizen = memoryStore.users.find(u => u.id == c.citizen_id);
      const sach = memoryStore.sachivalayams.find(s => s.id == c.sachivalayam_id);
      return {
        ...c,
        citizen_name: citizen?.name || 'Ravi Kumar',
        sachivalayam_name: sach?.name || 'Patamata Sachivalayam'
      };
    });
  }
  if (sqlTrim.includes('FROM complaint_status_history')) {
    return memoryStore.history.filter(h => h.complaint_id == params[0]);
  }
  if (sqlTrim.includes('FROM notifications')) {
    return memoryStore.notifications.filter(n => n.user_id == params[0]);
  }

  return [];
}

export default dbInstance;
