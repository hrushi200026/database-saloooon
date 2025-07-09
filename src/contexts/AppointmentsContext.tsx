import { createContext, useContext, useState, ReactNode } from 'react';
import { appointmentDb, initDatabase } from '@/lib/database';
import { useEffect } from 'react';

export interface Appointment {
  id: string;
  customerId: string;
  employeeId: string;
  serviceIds: string[];
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  total: number;
  notes: string;
}

interface AppointmentsContextType {
  appointments: Appointment[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Load appointments from database
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        await initDatabase();
        const dbAppointments = appointmentDb.getAll();
        setAppointments(dbAppointments);
      } catch (error) {
        console.error('Error loading appointments from database:', error);
      }
    };
    
    loadAppointments();
  }, []);

  const addAppointment = (newAppointment: Appointment) => {
    try {
      appointmentDb.create(newAppointment);
      setAppointments(prev => [...prev, newAppointment]);
    } catch (error) {
      console.error('Error adding appointment to database:', error);
      throw error;
    }
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    try {
      appointmentDb.update(id, updates);
      setAppointments(prev => 
        prev.map(appt => 
          appt.id === id ? { ...appt, ...updates } : appt
        )
      );
    } catch (error) {
      console.error('Error updating appointment in database:', error);
      throw error;
    }
  };

  return (
    <AppointmentsContext.Provider 
      value={{ 
        appointments, 
        selectedCustomerId,
        setSelectedCustomerId,
        addAppointment, 
        updateAppointment 
      }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
}
