import { Customer } from '@/contexts/CustomersContext';
import { Employee } from '@/contexts/StaffContext';
import { TallyItem } from '@/contexts/TallyContext';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Browser storage keys
const STORAGE_KEYS = {
  customers: 'salon_customers',
  employees: 'salon_employees',
  appointments: 'salon_appointments',
  tally: 'salon_tally',
  services: 'salon_services',
  products: 'salon_products'
};

// Browser storage utilities
const browserStorage = {
  get: (key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  
  set: (key: string, data: any[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
};

// Initialize database
export async function initDatabase() {
  if (isBrowser) {
    // Initialize browser storage with mock data if empty
    await initBrowserStorage();
    console.log('Browser storage initialized');
    return null;
  } else {
    // For server-side, we would initialize SQLite here
    console.log('Server-side database would be initialized here');
    return null;
  }
}

// Initialize browser storage with mock data
async function initBrowserStorage() {
  // Check if data already exists
  const existingCustomers = browserStorage.get(STORAGE_KEYS.customers);
  
  if (existingCustomers.length === 0) {
    console.log('Initializing browser storage with mock data...');
    
    // Import mock data
    const { mockCustomers, mockEmployees, mockServices, mockProducts } = await import('../data/mockData');
    
    // Store mock data in localStorage
    browserStorage.set(STORAGE_KEYS.customers, mockCustomers);
    browserStorage.set(STORAGE_KEYS.employees, mockEmployees);
    browserStorage.set(STORAGE_KEYS.services, mockServices);
    browserStorage.set(STORAGE_KEYS.products, mockProducts);
    browserStorage.set(STORAGE_KEYS.appointments, []);
    browserStorage.set(STORAGE_KEYS.tally, []);
    
    console.log('Mock data loaded into browser storage');
  }
}

// Customer operations
export const customerDb = {
  getAll: (): Customer[] => {
    if (isBrowser) {
      return browserStorage.get(STORAGE_KEYS.customers);
    }
    return [];
  },

  getById: (id: string): Customer | null => {
    if (isBrowser) {
      const customers = browserStorage.get(STORAGE_KEYS.customers);
      return customers.find((c: Customer) => c.id === id) || null;
    }
    return null;
  },

  create: (customer: Omit<Customer, 'id' | 'visitCount' | 'totalSpent' | 'lastVisit'>): Customer => {
    const id = `cust-${Date.now()}`;
    const now = new Date().toISOString();
    
    const newCustomer: Customer = {
      ...customer,
      id,
      visitCount: 0,
      totalSpent: 0,
      lastVisit: now
    };

    if (isBrowser) {
      const customers = browserStorage.get(STORAGE_KEYS.customers);
      customers.push(newCustomer);
      browserStorage.set(STORAGE_KEYS.customers, customers);
    }

    return newCustomer;
  },

  update: (id: string, updates: Partial<Customer>): void => {
    if (isBrowser) {
      const customers = browserStorage.get(STORAGE_KEYS.customers);
      const index = customers.findIndex((c: Customer) => c.id === id);
      if (index !== -1) {
        customers[index] = { ...customers[index], ...updates };
        browserStorage.set(STORAGE_KEYS.customers, customers);
      }
    }
  },

  delete: (id: string): void => {
    if (isBrowser) {
      const customers = browserStorage.get(STORAGE_KEYS.customers);
      const filtered = customers.filter((c: Customer) => c.id !== id);
      browserStorage.set(STORAGE_KEYS.customers, filtered);
    }
  }
};

// Employee operations
export const employeeDb = {
  getAll: (): Employee[] => {
    if (isBrowser) {
      return browserStorage.get(STORAGE_KEYS.employees);
    }
    return [];
  },

  create: (employee: Omit<Employee, 'id'>): Employee => {
    const id = `emp-${Date.now()}`;
    const newEmployee: Employee = { ...employee, id };

    if (isBrowser) {
      const employees = browserStorage.get(STORAGE_KEYS.employees);
      employees.push(newEmployee);
      browserStorage.set(STORAGE_KEYS.employees, employees);
    }

    return newEmployee;
  },

  update: (id: string, updates: Partial<Employee>): void => {
    if (isBrowser) {
      const employees = browserStorage.get(STORAGE_KEYS.employees);
      const index = employees.findIndex((e: Employee) => e.id === id);
      if (index !== -1) {
        employees[index] = { ...employees[index], ...updates };
        browserStorage.set(STORAGE_KEYS.employees, employees);
      }
    }
  },

  delete: (id: string): void => {
    if (isBrowser) {
      const employees = browserStorage.get(STORAGE_KEYS.employees);
      const filtered = employees.filter((e: Employee) => e.id !== id);
      browserStorage.set(STORAGE_KEYS.employees, filtered);
    }
  }
};

// Appointment operations
export const appointmentDb = {
  getAll: () => {
    if (isBrowser) {
      return browserStorage.get(STORAGE_KEYS.appointments);
    }
    return [];
  },

  create: (appointment: any) => {
    if (isBrowser) {
      const appointments = browserStorage.get(STORAGE_KEYS.appointments);
      appointments.push(appointment);
      browserStorage.set(STORAGE_KEYS.appointments, appointments);
    }
  },

  update: (id: string, updates: any) => {
    if (isBrowser) {
      const appointments = browserStorage.get(STORAGE_KEYS.appointments);
      const index = appointments.findIndex((a: any) => a.id === id);
      if (index !== -1) {
        appointments[index] = { ...appointments[index], ...updates };
        browserStorage.set(STORAGE_KEYS.appointments, appointments);
      }
    }
  }
};

// Tally operations
export const tallyDb = {
  getAll: (): TallyItem[] => {
    if (isBrowser) {
      return browserStorage.get(STORAGE_KEYS.tally);
    }
    return [];
  },

  create: (item: Omit<TallyItem, 'id' | 'paymentDate' | 'upiTransactionId'>): TallyItem => {
    const id = `tally-${Date.now()}`;
    const paymentDate = new Date().toISOString();
    
    const newItem: TallyItem = {
      ...item,
      id,
      paymentDate,
      upiTransactionId: undefined
    };

    if (isBrowser) {
      const tallyItems = browserStorage.get(STORAGE_KEYS.tally);
      tallyItems.push(newItem);
      browserStorage.set(STORAGE_KEYS.tally, tallyItems);
    }

    return newItem;
  },

  updatePaymentStatus: (id: string, status: 'completed' | 'failed' | 'cancelled', upiTransactionId?: string) => {
    if (isBrowser) {
      const tallyItems = browserStorage.get(STORAGE_KEYS.tally);
      const index = tallyItems.findIndex((item: TallyItem) => item.id === id);
      if (index !== -1) {
        tallyItems[index] = {
          ...tallyItems[index],
          paymentStatus: status,
          upiTransactionId: upiTransactionId || tallyItems[index].upiTransactionId
        };
        browserStorage.set(STORAGE_KEYS.tally, tallyItems);
      }
    }
  }
};

// Service operations
export const serviceDb = {
  getAll: () => {
    if (isBrowser) {
      return browserStorage.get(STORAGE_KEYS.services);
    }
    return [];
  },

  create: (service: any) => {
    if (isBrowser) {
      const services = browserStorage.get(STORAGE_KEYS.services);
      services.push(service);
      browserStorage.set(STORAGE_KEYS.services, services);
    }
  },

  update: (id: string, updates: any) => {
    if (isBrowser) {
      const services = browserStorage.get(STORAGE_KEYS.services);
      const index = services.findIndex((s: any) => s.id === id);
      if (index !== -1) {
        services[index] = { ...services[index], ...updates };
        browserStorage.set(STORAGE_KEYS.services, services);
      }
    }
  },

  delete: (id: string) => {
    if (isBrowser) {
      const services = browserStorage.get(STORAGE_KEYS.services);
      const filtered = services.filter((s: any) => s.id !== id);
      browserStorage.set(STORAGE_KEYS.services, filtered);
    }
  }
};

// Product operations
export const productDb = {
  getAll: () => {
    if (isBrowser) {
      return browserStorage.get(STORAGE_KEYS.products);
    }
    return [];
  },

  create: (product: any) => {
    if (isBrowser) {
      const products = browserStorage.get(STORAGE_KEYS.products);
      products.push(product);
      browserStorage.set(STORAGE_KEYS.products, products);
    }
  },

  update: (id: string, updates: any) => {
    if (isBrowser) {
      const products = browserStorage.get(STORAGE_KEYS.products);
      const index = products.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        products[index] = { ...products[index], ...updates };
        browserStorage.set(STORAGE_KEYS.products, products);
      }
    }
  },

  delete: (id: string) => {
    if (isBrowser) {
      const products = browserStorage.get(STORAGE_KEYS.products);
      const filtered = products.filter((p: any) => p.id !== id);
      browserStorage.set(STORAGE_KEYS.products, filtered);
    }
  }
};