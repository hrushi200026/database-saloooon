import Database from 'better-sqlite3';
import { Customer } from '@/contexts/CustomersContext';
import { Employee } from '@/contexts/StaffContext';
import { TallyItem } from '@/contexts/TallyContext';

// Database instance
let db: Database.Database;

// Initialize database
export function initDatabase() {
  db = new Database('salon.db');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  createTables();
  
  // Insert initial data if tables are empty
  insertInitialData();
  
  return db;
}

// Create all necessary tables
function createTables() {
  // Customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
      visit_count INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_visit TEXT,
      preferred_services TEXT, -- JSON array as string
      notes TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Staff/Employees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      photo TEXT,
      available BOOLEAN DEFAULT 1,
      specialties TEXT, -- JSON array as string
      rating REAL DEFAULT 5.0,
      next_available TEXT,
      working_hours_start TEXT DEFAULT '09:00',
      working_hours_end TEXT DEFAULT '18:00',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Services table
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      service_ids TEXT NOT NULL, -- JSON array as string
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
      total REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    )
  `);

  // Tally/Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tally_items (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      services TEXT NOT NULL, -- JSON array as string
      total_cost REAL NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'upi')) NOT NULL,
      payment_status TEXT CHECK(payment_status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
      payment_date TEXT,
      upi_transaction_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      category TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      description TEXT,
      brand TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables created successfully');
}

// Insert initial data from mock files
function insertInitialData() {
  // Check if data already exists
  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
  
  if (customerCount.count === 0) {
    console.log('Inserting initial data...');
    
    // Import mock data
    import('../data/mockData').then(({ mockCustomers, mockEmployees, mockServices, mockProducts }) => {
      // Insert customers
      const insertCustomer = db.prepare(`
        INSERT INTO customers (id, name, phone, email, gender, visit_count, total_spent, last_visit, preferred_services, notes, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      mockCustomers.forEach(customer => {
        insertCustomer.run(
          customer.id,
          customer.name,
          customer.phone,
          customer.email,
          customer.gender,
          customer.visitCount,
          customer.totalSpent,
          customer.lastVisit,
          JSON.stringify(customer.preferredServices),
          customer.notes,
          customer.photo
        );
      });

      // Insert employees
      const insertEmployee = db.prepare(`
        INSERT INTO employees (id, name, role, email, phone, photo, available, specialties, rating, next_available, working_hours_start, working_hours_end)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      mockEmployees.forEach(employee => {
        insertEmployee.run(
          employee.id,
          employee.name,
          employee.role,
          '', // email - not in mock data
          '', // phone - not in mock data
          employee.photo,
          employee.available ? 1 : 0,
          JSON.stringify(employee.specialties),
          employee.rating,
          employee.nextAvailable,
          employee.workingHours.start,
          employee.workingHours.end
        );
      });

      // Insert services
      const insertService = db.prepare(`
        INSERT INTO services (id, name, duration, price, category, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      mockServices.forEach(service => {
        insertService.run(
          service.id,
          service.name,
          service.duration,
          service.price,
          service.category,
          service.description
        );
      });

      // Insert products
      const insertProduct = db.prepare(`
        INSERT INTO products (id, name, price, image, category, stock, description, brand)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      mockProducts.forEach(product => {
        insertProduct.run(
          product.id,
          product.name,
          product.price,
          product.image,
          product.category,
          product.stock,
          product.description,
          product.brand
        );
      });

      console.log('Initial data inserted successfully');
    });
  }
}

// Customer operations
export const customerDb = {
  getAll: (): Customer[] => {
    const stmt = db.prepare('SELECT * FROM customers ORDER BY name');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      gender: row.gender,
      visitCount: row.visit_count,
      totalSpent: row.total_spent,
      lastVisit: row.last_visit,
      preferredServices: JSON.parse(row.preferred_services || '[]'),
      notes: row.notes,
      photo: row.photo
    }));
  },

  getById: (id: string): Customer | null => {
    const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      gender: row.gender,
      visitCount: row.visit_count,
      totalSpent: row.total_spent,
      lastVisit: row.last_visit,
      preferredServices: JSON.parse(row.preferred_services || '[]'),
      notes: row.notes,
      photo: row.photo
    };
  },

  create: (customer: Omit<Customer, 'id' | 'visitCount' | 'totalSpent' | 'lastVisit'>): Customer => {
    const id = `cust-${Date.now()}`;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO customers (id, name, phone, email, gender, visit_count, total_spent, last_visit, preferred_services, notes, photo)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      customer.name,
      customer.phone,
      customer.email,
      customer.gender,
      now,
      JSON.stringify(customer.preferredServices),
      customer.notes || '',
      customer.photo
    );

    return {
      ...customer,
      id,
      visitCount: 0,
      totalSpent: 0,
      lastVisit: now
    };
  },

  update: (id: string, updates: Partial<Customer>): void => {
    const fields = [];
    const values = [];
    
    if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.phone) { fields.push('phone = ?'); values.push(updates.phone); }
    if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
    if (updates.gender) { fields.push('gender = ?'); values.push(updates.gender); }
    if (updates.visitCount !== undefined) { fields.push('visit_count = ?'); values.push(updates.visitCount); }
    if (updates.totalSpent !== undefined) { fields.push('total_spent = ?'); values.push(updates.totalSpent); }
    if (updates.lastVisit) { fields.push('last_visit = ?'); values.push(updates.lastVisit); }
    if (updates.preferredServices) { fields.push('preferred_services = ?'); values.push(JSON.stringify(updates.preferredServices)); }
    if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
    if (updates.photo !== undefined) { fields.push('photo = ?'); values.push(updates.photo); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  },

  delete: (id: string): void => {
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run(id);
  }
};

// Employee operations
export const employeeDb = {
  getAll: (): Employee[] => {
    const stmt = db.prepare('SELECT * FROM employees ORDER BY name');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      email: row.email,
      phone: row.phone,
      photo: row.photo,
      available: Boolean(row.available),
      specialties: JSON.parse(row.specialties || '[]'),
      rating: row.rating,
      nextAvailable: row.next_available,
      workingHours: {
        start: row.working_hours_start,
        end: row.working_hours_end
      }
    }));
  },

  create: (employee: Omit<Employee, 'id'>): Employee => {
    const id = `emp-${Date.now()}`;
    
    const stmt = db.prepare(`
      INSERT INTO employees (id, name, role, email, phone, photo, available, specialties, rating, next_available, working_hours_start, working_hours_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      employee.name,
      employee.role,
      employee.email || '',
      employee.phone || '',
      employee.photo,
      employee.available ? 1 : 0,
      JSON.stringify(employee.specialties || []),
      employee.rating || 5,
      employee.nextAvailable || 'Now',
      employee.workingHours?.start || '09:00',
      employee.workingHours?.end || '18:00'
    );

    return { ...employee, id };
  },

  update: (id: string, updates: Partial<Employee>): void => {
    const fields = [];
    const values = [];
    
    if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.role) { fields.push('role = ?'); values.push(updates.role); }
    if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
    if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
    if (updates.photo !== undefined) { fields.push('photo = ?'); values.push(updates.photo); }
    if (updates.available !== undefined) { fields.push('available = ?'); values.push(updates.available ? 1 : 0); }
    if (updates.specialties) { fields.push('specialties = ?'); values.push(JSON.stringify(updates.specialties)); }
    if (updates.rating !== undefined) { fields.push('rating = ?'); values.push(updates.rating); }
    if (updates.nextAvailable !== undefined) { fields.push('next_available = ?'); values.push(updates.nextAvailable); }
    if (updates.workingHours) {
      fields.push('working_hours_start = ?', 'working_hours_end = ?');
      values.push(updates.workingHours.start, updates.workingHours.end);
    }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = db.prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  },

  delete: (id: string): void => {
    const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
    stmt.run(id);
  }
};

// Appointment operations
export const appointmentDb = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM appointments ORDER BY date, time');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      employeeId: row.employee_id,
      serviceIds: JSON.parse(row.service_ids),
      date: row.date,
      time: row.time,
      status: row.status,
      total: row.total,
      notes: row.notes
    }));
  },

  create: (appointment: any) => {
    const stmt = db.prepare(`
      INSERT INTO appointments (id, customer_id, employee_id, service_ids, date, time, status, total, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      appointment.id,
      appointment.customerId,
      appointment.employeeId,
      JSON.stringify(appointment.serviceIds),
      appointment.date,
      appointment.time,
      appointment.status,
      appointment.total,
      appointment.notes || ''
    );
  },

  update: (id: string, updates: any) => {
    const fields = [];
    const values = [];
    
    if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
    if (updates.total !== undefined) { fields.push('total = ?'); values.push(updates.total); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }
};

// Tally operations
export const tallyDb = {
  getAll: (): TallyItem[] => {
    const stmt = db.prepare('SELECT * FROM tally_items ORDER BY date DESC, time DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      date: row.date,
      time: row.time,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      staffName: row.staff_name,
      services: JSON.parse(row.services),
      totalCost: row.total_cost,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      paymentDate: row.payment_date,
      upiTransactionId: row.upi_transaction_id
    }));
  },

  create: (item: Omit<TallyItem, 'id' | 'paymentDate' | 'upiTransactionId'>): TallyItem => {
    const id = `tally-${Date.now()}`;
    const paymentDate = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO tally_items (id, date, time, customer_name, customer_phone, staff_name, services, total_cost, payment_method, payment_status, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      item.date,
      item.time,
      item.customerName,
      item.customerPhone,
      item.staffName,
      JSON.stringify(item.services),
      item.totalCost,
      item.paymentMethod,
      item.paymentStatus,
      paymentDate
    );

    return {
      ...item,
      id,
      paymentDate,
      upiTransactionId: undefined
    };
  },

  updatePaymentStatus: (id: string, status: 'completed' | 'failed' | 'cancelled', upiTransactionId?: string) => {
    const stmt = db.prepare(`
      UPDATE tally_items 
      SET payment_status = ?, upi_transaction_id = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(status, upiTransactionId || null, new Date().toISOString(), id);
  }
};

// Service operations
export const serviceDb = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM services ORDER BY name');
    return stmt.all();
  },

  create: (service: any) => {
    const stmt = db.prepare(`
      INSERT INTO services (id, name, duration, price, category, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      service.id,
      service.name,
      service.duration,
      service.price,
      service.category,
      service.description
    );
  },

  update: (id: string, updates: any) => {
    const fields = [];
    const values = [];
    
    if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.duration !== undefined) { fields.push('duration = ?'); values.push(updates.duration); }
    if (updates.price !== undefined) { fields.push('price = ?'); values.push(updates.price); }
    if (updates.category) { fields.push('category = ?'); values.push(updates.category); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = db.prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM services WHERE id = ?');
    stmt.run(id);
  }
};

// Product operations
export const productDb = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM products ORDER BY name');
    return stmt.all();
  },

  create: (product: any) => {
    const stmt = db.prepare(`
      INSERT INTO products (id, name, price, image, category, stock, description, brand)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      product.id,
      product.name,
      product.price,
      product.image,
      product.category,
      product.stock,
      product.description,
      product.brand
    );
  },

  update: (id: string, updates: any) => {
    const fields = [];
    const values = [];
    
    if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.price !== undefined) { fields.push('price = ?'); values.push(updates.price); }
    if (updates.image !== undefined) { fields.push('image = ?'); values.push(updates.image); }
    if (updates.category) { fields.push('category = ?'); values.push(updates.category); }
    if (updates.stock !== undefined) { fields.push('stock = ?'); values.push(updates.stock); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.brand) { fields.push('brand = ?'); values.push(updates.brand); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
  }
};

// Initialize database on module load
if (typeof window === 'undefined') {
  // Only initialize on server side
  initDatabase();
}