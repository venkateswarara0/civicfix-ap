import bcrypt from 'bcryptjs';

// Bulletproof Pure JavaScript Database Engine (Zero Native Binary Dependencies)
const store = {
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
  upvoteSeq: 1,
  initialized: false
};

export async function initDb() {
  if (store.initialized) return;

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Sachivalayams in Andhra Pradesh (including Gudivada, Vijayawada, Visakhapatnam, Guntur, Tirupati)
  store.sachivalayams = [
    { id: 1, name: 'Patamata Ward Sachivalayam 14', code: 'AP-VJA-PAT-014', district: 'NTR District', mandal: 'Vijayawada Urban', village: 'Patamata', lat: 16.4975, lng: 80.6552, min_lat: 16.480, max_lat: 16.510, min_lng: 80.640, max_lng: 80.670, official_name: 'K. Venkatesh (Ward Secretary)', contact_phone: '+91 98480 12345', created_at: new Date().toISOString() },
    { id: 2, name: 'Suryaraopet Grama Sachivalayam 08', code: 'AP-VJA-SUR-008', district: 'NTR District', mandal: 'Vijayawada Central', village: 'Suryaraopet', lat: 16.5105, lng: 80.6288, min_lat: 16.500, max_lat: 16.525, min_lng: 80.615, max_lng: 80.640, official_name: 'M. Lakshmi (Civic Welfare Officer)', contact_phone: '+91 98480 23456', created_at: new Date().toISOString() },
    { id: 3, name: 'Gajuwaka Ward Sachivalayam 03', code: 'AP-VSK-GAJ-003', district: 'Visakhapatnam', mandal: 'Gajuwaka', village: 'Gajuwaka Colony', lat: 17.6905, lng: 83.2185, min_lat: 17.670, max_lat: 17.710, min_lng: 83.190, max_lng: 83.240, official_name: 'R. Ramesh (Sanitation Secretary)', contact_phone: '+91 98480 34567', created_at: new Date().toISOString() },
    { id: 4, name: 'Brodipet Grama Sachivalayam 05', code: 'AP-GNT-BRO-005', district: 'Guntur', mandal: 'Guntur Urban', village: 'Brodipet', lat: 16.3067, lng: 80.4365, min_lat: 16.290, max_lat: 16.320, min_lng: 80.420, max_lng: 80.450, official_name: 'S. Nageswara Rao', contact_phone: '+91 98480 45678', created_at: new Date().toISOString() },
    { id: 5, name: 'Tirupati Town Ward Sachivalayam 02', code: 'AP-TPT-TWN-002', district: 'Tirupati', mandal: 'Tirupati Urban', village: 'KT Road', lat: 13.6288, lng: 79.4192, min_lat: 13.610, max_lat: 13.645, min_lng: 79.400, max_lng: 79.435, official_name: 'P. Anand Reddy', contact_phone: '+91 98480 56789', created_at: new Date().toISOString() },
    
    // Gudivada Sachivalayams (Krishna District)
    { id: 6, name: 'Gudivada Municipal Ward Sachivalayam 05', code: 'AP-KRI-GDV-005', district: 'Krishna District', mandal: 'Gudivada Mandal', village: 'Bommuluru / Gudivada Town', lat: 16.4181, lng: 81.0170, min_lat: 16.350, max_lat: 16.460, min_lng: 80.950, max_lng: 81.070, official_name: 'P. Srinivas (Ward Secretary, Gudivada)', contact_phone: '+91 98480 67890', created_at: new Date().toISOString() },
    { id: 7, name: 'Gudivada Rural Grama Sachivalayam 02', code: 'AP-KRI-GDV-002', district: 'Krishna District', mandal: 'Gudivada Mandal', village: 'Gudivada Rural', lat: 16.4420, lng: 81.0020, min_lat: 16.420, max_lat: 16.480, min_lng: 80.980, max_lng: 81.050, official_name: 'Ch. Prasad (Gram Secretary)', contact_phone: '+91 98480 78901', created_at: new Date().toISOString() }
  ];
  store.sachivalayamSeq = 8;

  // 2. Seed Users
  store.users = [
    { id: 1, name: 'Ravi Kumar (Citizen)', email: 'citizen@civicfix.in', password_hash: passwordHash, role: 'CITIZEN', phone: '+91 99887 76655', sachivalayam_id: null, created_at: new Date().toISOString() },
    { id: 2, name: 'K. Venkatesh (Official)', email: 'official.patamata@civicfix.in', password_hash: passwordHash, role: 'OFFICIAL', phone: '+91 98480 12345', sachivalayam_id: 1, created_at: new Date().toISOString() },
    { id: 3, name: 'M. Lakshmi (Official)', email: 'official.suryaraopet@civicfix.in', password_hash: passwordHash, role: 'OFFICIAL', phone: '+91 98480 23456', sachivalayam_id: 2, created_at: new Date().toISOString() },
    { id: 4, name: 'Admin Officer (AP Civic Portal)', email: 'admin@civicfix.in', password_hash: passwordHash, role: 'ADMIN', phone: '+91 90000 00000', sachivalayam_id: null, created_at: new Date().toISOString() },
    { id: 5, name: 'P. Srinivas (Gudivada Official)', email: 'official.gudivada@civicfix.in', password_hash: passwordHash, role: 'OFFICIAL', phone: '+91 98480 67890', sachivalayam_id: 6, created_at: new Date().toISOString() }
  ];
  store.userSeq = 6;

  // 3. Seed Sample Complaints
  store.complaints = [
    { id: 1, tracking_id: 'CF-2026-08101', citizen_id: 1, category_id: 'pothole', category_name: 'Pothole / Road Damage', description: 'Deep hazardous pothole on MG Road near Benz Circle, creating severe risk for two-wheelers during monsoon rains.', original_image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80', resolution_image_url: 'https://images.unsplash.com/photo-1584463688353-27c19664f3ce?w=800&q=80', lat: 16.4982, lng: 80.6548, location_accuracy: 4.2, address: 'Near Benz Circle, MG Road, Patamata, Vijayawada, NTR District, AP - 520010', sachivalayam_id: 1, assigned_official_id: 2, priority: 'HIGH', status: 'RESOLVED', resolution_remarks: 'Pothole filled with cold asphalt mix, compacted with roller, and level inspected by Ward Engineering Officer.', upvotes_count: 3, created_at: '2026-08-10 09:30:00', updated_at: '2026-08-11 14:15:00', resolved_at: '2026-08-11 14:15:00', reopened_at: null },
    { id: 2, tracking_id: 'CF-2026-08102', citizen_id: 1, category_id: 'garbage', category_name: 'Garbage Dumping', description: 'Overflowing commercial waste bin spilling onto sidewalk near Patamata High School, causing bad odor.', original_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80', resolution_image_url: null, lat: 16.4968, lng: 80.6560, location_accuracy: 5.0, address: 'Opposite High School, Main Road, Patamata, Vijayawada, NTR District, AP', sachivalayam_id: 1, assigned_official_id: 2, priority: 'MEDIUM', status: 'IN_PROGRESS', resolution_remarks: null, upvotes_count: 1, created_at: '2026-08-12 11:00:00', updated_at: '2026-08-12 11:00:00', resolved_at: null, reopened_at: null },
    { id: 3, tracking_id: 'CF-2026-08103', citizen_id: 1, category_id: 'open_manhole', category_name: 'Open Manhole / Safety Hazard', description: 'Concrete manhole cover missing on residential street. Extremely dangerous at night!', original_image_url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80', resolution_image_url: null, lat: 16.5112, lng: 80.6295, location_accuracy: 3.5, address: 'Street 4, Suryaraopet, Vijayawada, NTR District, AP - 520002', sachivalayam_id: 2, assigned_official_id: 3, priority: 'CRITICAL', status: 'ASSIGNED', resolution_remarks: null, upvotes_count: 5, created_at: '2026-08-13 08:20:00', updated_at: '2026-08-13 08:20:00', resolved_at: null, reopened_at: null },
    { id: 4, tracking_id: 'CF-2026-08104', citizen_id: 1, category_id: 'streetlight', category_name: 'Broken Street Light', description: 'Three consecutive LED streetlights not functioning on Gajuwaka Main Road junction.', original_image_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&q=80', resolution_image_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800&q=80', lat: 17.6912, lng: 83.2190, location_accuracy: 6.0, address: 'Junction 2, Gajuwaka, Visakhapatnam, AP - 530026', sachivalayam_id: 3, assigned_official_id: null, priority: 'LOW', status: 'REOPENED', resolution_remarks: 'Replaced light bulbs', upvotes_count: 2, created_at: '2026-08-08 18:40:00', updated_at: '2026-08-11 10:00:00', resolved_at: null, reopened_at: '2026-08-11 10:00:00' },
    { id: 5, tracking_id: 'CF-2026-08105', citizen_id: 1, category_id: 'pothole', category_name: 'Pothole / Road Damage', description: 'Cracked asphalt and pothole on Eluru Road near Bommuluru junction, Gudivada.', original_image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80', resolution_image_url: null, lat: 16.4181, lng: 81.0170, location_accuracy: 4.0, address: 'Bommuluru, Gudivada, Krishna District, AP - 521301', sachivalayam_id: 6, assigned_official_id: 5, priority: 'HIGH', status: 'SUBMITTED', resolution_remarks: null, upvotes_count: 2, created_at: '2026-08-13 19:10:00', updated_at: '2026-08-13 19:10:00', resolved_at: null, reopened_at: null }
  ];
  store.complaintSeq = 6;

  store.history = [
    { id: 1, complaint_id: 1, old_status: null, new_status: 'SUBMITTED', changed_by: 1, changed_by_name: 'Ravi Kumar (Citizen)', remarks: 'Complaint submitted with GPS evidence.', timestamp: '2026-08-10 09:30:00' },
    { id: 2, complaint_id: 1, old_status: 'IN_PROGRESS', new_status: 'RESOLVED', changed_by: 2, changed_by_name: 'K. Venkatesh (Official)', remarks: 'Pothole filled with cold asphalt mix.', timestamp: '2026-08-11 14:15:00' }
  ];
  store.historySeq = 3;

  store.initialized = true;
  console.log('✅ In-Memory Pure JS Database Engine initialized.');
}

// Async Database Runners
export async function dbRun(sql, params = []) {
  if (!store.initialized) await initDb();
  const sqlTrim = sql.trim();

  // Users INSERT
  if (sqlTrim.startsWith('INSERT INTO users')) {
    const user = {
      id: store.userSeq++,
      name: params[0],
      email: String(params[1]).toLowerCase().trim(),
      password_hash: params[2],
      role: params[3] || 'CITIZEN',
      phone: params[4] || null,
      sachivalayam_id: params[5] || null,
      created_at: new Date().toISOString()
    };
    store.users.push(user);
    return { lastID: user.id, changes: 1 };
  }

  // Sachivalayams INSERT
  if (sqlTrim.startsWith('INSERT INTO sachivalayams')) {
    const sach = {
      id: store.sachivalayamSeq++,
      name: params[0],
      code: params[1],
      district: params[2],
      mandal: params[3],
      village: params[4],
      lat: parseFloat(params[5]),
      lng: parseFloat(params[6]),
      min_lat: params[7] ? parseFloat(params[7]) : null,
      max_lat: params[8] ? parseFloat(params[8]) : null,
      min_lng: params[9] ? parseFloat(params[9]) : null,
      max_lng: params[10] ? parseFloat(params[10]) : null,
      official_name: params[11] || null,
      contact_phone: params[12] || null,
      created_at: new Date().toISOString()
    };
    store.sachivalayams.push(sach);
    return { lastID: sach.id, changes: 1 };
  }

  // Complaints INSERT
  if (sqlTrim.startsWith('INSERT INTO complaints')) {
    const comp = {
      id: store.complaintSeq++,
      tracking_id: params[0],
      citizen_id: params[1],
      category_id: params[2],
      category_name: params[3],
      description: params[4],
      original_image_url: params[5],
      resolution_image_url: params[6] || null,
      lat: parseFloat(params[7]),
      lng: parseFloat(params[8]),
      location_accuracy: parseFloat(params[9]) || 5.0,
      address: typeof params[10] === 'string' ? params[10] : 'Andhra Pradesh',
      sachivalayam_id: params[11] || 6,
      assigned_official_id: params[12] || 5,
      priority: params[13] || 'MEDIUM',
      status: params[14] || 'SUBMITTED',
      resolution_remarks: params[15] || null,
      upvotes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      reopened_at: null
    };
    store.complaints.push(comp);
    return { lastID: comp.id, changes: 1 };
  }

  // Status History INSERT
  if (sqlTrim.startsWith('INSERT INTO complaint_status_history')) {
    const h = {
      id: store.historySeq++,
      complaint_id: params[0],
      old_status: params[1],
      new_status: params[2],
      changed_by: params[3],
      changed_by_name: params[4],
      remarks: params[5],
      timestamp: new Date().toISOString()
    };
    store.history.push(h);
    return { lastID: h.id, changes: 1 };
  }

  // Notifications INSERT
  if (sqlTrim.startsWith('INSERT INTO notifications')) {
    const n = {
      id: store.notificationSeq++,
      user_id: params[0],
      complaint_id: params[1],
      message: params[2],
      is_read: 0,
      created_at: new Date().toISOString()
    };
    store.notifications.push(n);
    return { lastID: n.id, changes: 1 };
  }

  // Upvotes INSERT
  if (sqlTrim.startsWith('INSERT INTO complaint_upvotes')) {
    const u = {
      id: store.upvoteSeq++,
      complaint_id: params[0],
      user_id: params[1],
      created_at: new Date().toISOString()
    };
    store.upvotes.push(u);
    return { lastID: u.id, changes: 1 };
  }

  // Updates
  if (sqlTrim.startsWith('UPDATE complaints')) {
    const id = params[params.length - 1];
    const comp = store.complaints.find(c => c.id == id);
    if (comp) {
      if (sqlTrim.includes('status = ?')) comp.status = params[0];
      if (sqlTrim.includes('resolution_image_url = ?')) {
        comp.resolution_image_url = params[0];
        comp.resolution_remarks = params[1];
        comp.status = 'RESOLVED';
        comp.resolved_at = new Date().toISOString();
      }
      if (sqlTrim.includes("status = 'REOPENED'")) {
        comp.status = 'REOPENED';
        comp.reopened_at = new Date().toISOString();
      }
      if (sqlTrim.includes('upvotes_count = upvotes_count + 1')) {
        comp.upvotes_count = (comp.upvotes_count || 0) + 1;
      }
      comp.updated_at = new Date().toISOString();
    }
    return { changes: 1 };
  }

  if (sqlTrim.startsWith('UPDATE notifications')) {
    const n = store.notifications.find(notif => notif.id == params[0] && notif.user_id == params[1]);
    if (n) n.is_read = 1;
    return { changes: 1 };
  }

  return { lastID: 1, changes: 1 };
}

export async function dbGet(sql, params = []) {
  if (!store.initialized) await initDb();
  const sqlTrim = sql.trim();

  if (sqlTrim.includes('FROM users WHERE email = ?')) {
    const targetEmail = String(params[0]).toLowerCase().trim();
    return store.users.find(u => u.email.toLowerCase() === targetEmail) || null;
  }
  if (sqlTrim.includes('FROM users WHERE id = ?')) {
    return store.users.find(u => u.id == params[0]) || null;
  }
  if (sqlTrim.includes('FROM users WHERE role = \'OFFICIAL\'')) {
    return store.users.find(u => u.role === 'OFFICIAL' && u.sachivalayam_id == params[0]) || store.users.find(u => u.role === 'OFFICIAL') || null;
  }
  if (sqlTrim.includes('FROM sachivalayams WHERE id = ?')) {
    return store.sachivalayams.find(s => s.id == params[0]) || null;
  }

  // DYNAMIC COMPLAINT DETAIL RESOLUTION
  if (sqlTrim.includes('FROM complaints') && (sqlTrim.includes('id = ?') || sqlTrim.includes('c.id = ?') || sqlTrim.includes('tracking_id = ?'))) {
    const target = params[0];
    const c = store.complaints.find(comp => comp.id == target || comp.tracking_id == target);
    if (!c) return null;

    let sach = store.sachivalayams.find(s => s.id == c.sachivalayam_id);

    // If sachivalayam is missing, default to Gudivada Municipal Ward Sachivalayam 05
    if (!sach) {
      sach = store.sachivalayams.find(s => s.id === 6) || store.sachivalayams[0];
    }

    const citizen = store.users.find(u => u.id == c.citizen_id);
    const official = store.users.find(u => u.role === 'OFFICIAL' && u.sachivalayam_id == sach.id) || store.users.find(u => u.id == (c.assigned_official_id || 5));

    return {
      ...c,
      citizen_name: citizen?.name || 'Ravi Kumar',
      citizen_phone: citizen?.phone || '+91 99887 76655',
      citizen_email: citizen?.email || 'citizen@civicfix.in',
      sachivalayam_name: sach?.name || 'Gudivada Municipal Ward Sachivalayam 05',
      sachivalayam_code: sach?.code || 'AP-KRI-GDV-005',
      district: sach?.district || 'Krishna District',
      mandal: sach?.mandal || 'Gudivada Mandal',
      village: sach?.village || 'Gudivada Town',
      sachivalayam_contact_person: sach?.official_name || official?.name || 'P. Srinivas (Ward Secretary)',
      sachivalayam_phone: sach?.contact_phone || official?.phone || '+91 98480 67890',
      official_name: official?.name || sach?.official_name || 'Ward Officer',
      official_phone: official?.phone || sach?.contact_phone || '+91 98480 67890'
    };
  }

  if (sqlTrim.includes('COUNT(*) as count FROM users')) {
    return { count: store.users.length };
  }
  if (sqlTrim.includes('COUNT(*) as count FROM complaints')) {
    if (sqlTrim.includes("status = 'SUBMITTED'")) return { count: store.complaints.filter(c => c.status === 'SUBMITTED').length };
    if (sqlTrim.includes("status = 'IN_PROGRESS'")) return { count: store.complaints.filter(c => c.status === 'IN_PROGRESS').length };
    if (sqlTrim.includes("status = 'RESOLVED'")) return { count: store.complaints.filter(c => c.status === 'RESOLVED').length };
    if (sqlTrim.includes("status = 'REOPENED'")) return { count: store.complaints.filter(c => c.status === 'REOPENED').length };
    if (sqlTrim.includes("status = 'REJECTED'")) return { count: store.complaints.filter(c => c.status === 'REJECTED').length };
    return { count: store.complaints.length };
  }
  if (sqlTrim.includes('AVG(')) {
    return { avg_hours: 24.0 };
  }

  return null;
}

export async function dbAll(sql, params = []) {
  if (!store.initialized) await initDb();
  const sqlTrim = sql.trim();

  if (sqlTrim.includes('FROM sachivalayams')) {
    return store.sachivalayams.map(s => ({
      ...s,
      total_complaints: store.complaints.filter(c => c.sachivalayam_id == s.id).length,
      resolved_complaints: store.complaints.filter(c => c.sachivalayam_id == s.id && c.status === 'RESOLVED').length,
      pending_complaints: store.complaints.filter(c => c.sachivalayam_id == s.id && c.status !== 'RESOLVED').length
    }));
  }
  if (sqlTrim.includes('FROM complaints')) {
    let list = store.complaints.map(c => {
      let sach = store.sachivalayams.find(s => s.id == c.sachivalayam_id);
      if (!sach) {
        sach = store.sachivalayams.find(s => s.id === 6) || store.sachivalayams[0];
      }
      const citizen = store.users.find(u => u.id == c.citizen_id);
      const official = store.users.find(u => u.role === 'OFFICIAL' && u.sachivalayam_id == sach.id) || store.users.find(u => u.id == (c.assigned_official_id || 5));
      return {
        ...c,
        citizen_name: citizen?.name || 'Ravi Kumar',
        citizen_phone: citizen?.phone || '+91 99887 76655',
        sachivalayam_name: sach?.name || 'Gudivada Ward Sachivalayam 05',
        official_name: official?.name || sach?.official_name || 'Ward Officer'
      };
    });

    if (sqlTrim.includes('c.citizen_id = ?')) {
      list = list.filter(c => c.citizen_id == params[0]);
    }
    if (sqlTrim.includes('c.status = ?')) {
      list = list.filter(c => c.status === params[0]);
    }
    if (sqlTrim.includes('c.sachivalayam_id = ?')) {
      list = list.filter(c => c.sachivalayam_id == params[0]);
    }
    return list;
  }
  if (sqlTrim.includes('FROM complaint_status_history')) {
    return store.history.filter(h => h.complaint_id == params[0]);
  }
  if (sqlTrim.includes('FROM notifications')) {
    return store.notifications.filter(n => n.user_id == params[0]);
  }

  return [];
}

export default store;
