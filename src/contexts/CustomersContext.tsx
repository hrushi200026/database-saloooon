import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { mockCustomers } from '../data/mockData';

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
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with mock data on first load
  useEffect(() => {
    if (!isInitialized && customers.length === 0) {
      setCustomers(mockCustomers);
      setIsInitialized(true);
    }
  }, [isInitialized, customers.length]);

  const addCustomer = (customerData: Omit<Customer, 'id' | 'visitCount' | 'totalSpent' | 'lastVisit'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: uuidv4(),
      visitCount: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString(),
      preferredServices: customerData.preferredServices || []
    };
    
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === id ? { ...customer, ...updates } : customer
      )
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
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
