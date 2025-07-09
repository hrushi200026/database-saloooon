import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { employeeDb, initDatabase } from '@/lib/database';

export interface Employee {
  id: string;
  name: string;
  role: string;
  photo: string;
  available: boolean;
  specialties?: string[];
  rating?: number;
  nextAvailable?: string;
  workingHours?: {
    start: string;
    end: string;
  };
}

interface StaffContextType {
  employees: Employee[];
  availableStaffCount: number;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Initialize database and load employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        await initDatabase();
        const dbEmployees = employeeDb.getAll();
        setEmployees(dbEmployees);
      } catch (error) {
        console.error('Error loading employees from database:', error);
      }
    };
    
    loadEmployees();
  }, []);
  
  const availableStaffCount = employees.filter(emp => emp.available).length;
  
  // Log when employees or available count changes
  useEffect(() => {
    console.log('Available staff count updated:', availableStaffCount, 'out of', employees.length);
  }, [availableStaffCount, employees.length]);

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    try {
      employeeDb.update(id, updates);
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === id ? { ...emp, ...updates } : emp
        )
      );
    } catch (error) {
      console.error('Error updating employee in database:', error);
      throw error;
    }
  };

  const removeEmployee = (id: string) => {
    try {
      employeeDb.delete(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (error) {
      console.error('Error deleting employee from database:', error);
      throw error;
    }
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    try {
      const newEmployee = employeeDb.create(employee);
      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee to database:', error);
      throw error;
    }
  };

  return (
    <StaffContext.Provider 
      value={{
        employees,
        availableStaffCount,
        updateEmployee,
        removeEmployee,
        addEmployee
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}
