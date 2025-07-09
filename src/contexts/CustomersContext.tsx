import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { customerDb, initDatabase } from '@/lib/database';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  visitCount: number;
  totalSpent: number;
  lastVisit: string;
  preferredServices: string[];
  notes?: string;
  photo: string;
}

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'visitCount' | 'totalSpent' | 'lastVisit'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Initialize database and load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        await initDatabase();
        const dbCustomers = customerDb.getAll();
        setCustomers(dbCustomers);
      } catch (error) {
        console.error('Error loading customers from database:', error);
      }
    };
    
    loadCustomers();
  }, []);

  const addCustomer = (customerData: Omit<Customer, 'id' | 'visitCount' | 'totalSpent' | 'lastVisit'>) => {
    try {
      const newCustomer = customerDb.create(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer to database:', error);
      throw error;
    }
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    try {
      customerDb.update(id, updates);
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? { ...customer, ...updates } : customer
        )
      );
    } catch (error) {
      console.error('Error updating customer in database:', error);
      throw error;
    }
  };

  const deleteCustomer = (id: string) => {
    try {
      customerDb.delete(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (error) {
      console.error('Error deleting customer from database:', error);
      throw error;
    }
  };

  return (
    <CustomersContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer }}>
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
}
