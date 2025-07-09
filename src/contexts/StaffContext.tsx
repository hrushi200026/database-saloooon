import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockEmployees as initialMockEmployees } from '@/data/mockData';

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
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize with mock data on first load
  useEffect(() => {
    if (!isInitialized && employees.length === 0) {
      console.log('Initializing staff data...');
      const formattedEmployees = initialMockEmployees.map(emp => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        photo: emp.photo,
        available: emp.available,
        specialties: emp.specialties || [],
        rating: emp.rating || 0,
        nextAvailable: emp.nextAvailable || '',
        workingHours: emp.workingHours || { start: '09:00', end: '18:00' }
      }));
      
      console.log('Setting employees:', formattedEmployees);
      setEmployees(formattedEmployees);
      setIsInitialized(true);
    }
  }, [isInitialized, employees.length]);
  
  const availableStaffCount = employees.filter(emp => emp.available).length;
  
  // Log when employees or available count changes
  useEffect(() => {
    console.log('Available staff count updated:', availableStaffCount, 'out of', employees.length);
  }, [availableStaffCount, employees.length]);

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === id ? { ...emp, ...updates } : emp
      )
    );
  };

  const removeEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee = {
      ...employee,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [...prev, newEmployee]);
    return newEmployee;
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
