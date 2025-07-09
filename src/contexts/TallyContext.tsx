import React, { createContext, useContext, useState } from 'react';
import { useEffect } from 'react';
import { tallyDb, initDatabase } from '@/lib/database';

export type PaymentMethod = 'cash' | 'card' | 'upi';

export interface TallyItem {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  staffName: string;
  services: { name: string; price: number }[];
  totalCost: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentDate: string;
  upiTransactionId?: string;
}

interface TallyContextType {
  tallyItems: TallyItem[];
  addTallyItem: (item: Omit<TallyItem, 'id' | 'paymentDate' | 'upiTransactionId'> & { paymentStatus?: 'pending' | 'completed' | 'failed' | 'cancelled' }) => TallyItem;
  updatePaymentStatus: (id: string, status: 'completed' | 'failed' | 'cancelled', upiTransactionId?: string) => void;
}

const TallyContext = createContext<TallyContextType | undefined>(undefined);

export const TallyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tallyItems, setTallyItems] = useState<TallyItem[]>([]);

  // Load tally items from database
  useEffect(() => {
    const loadTallyItems = async () => {
      try {
        await initDatabase();
        const dbTallyItems = tallyDb.getAll();
        setTallyItems(dbTallyItems);
      } catch (error) {
        console.error('Error loading tally items from database:', error);
      }
    };
    
    loadTallyItems();
  }, []);

  const addTallyItem = (item: Omit<TallyItem, 'id' | 'paymentDate' | 'upiTransactionId'> & { paymentStatus?: 'pending' | 'completed' | 'failed' | 'cancelled' }): TallyItem => {
    try {
      const newItem = tallyDb.create({
        ...item,
        paymentStatus: item.paymentStatus || 'pending'
      });
      setTallyItems(prev => [...prev, newItem]);
      return newItem;
    } catch (error) {
      console.error('Error adding tally item to database:', error);
      throw error;
    }
  };

  const updatePaymentStatus = (id: string, status: 'completed' | 'failed' | 'cancelled', upiTransactionId?: string) => {
    try {
      tallyDb.updatePaymentStatus(id, status, upiTransactionId);
      setTallyItems(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, paymentStatus: status, upiTransactionId: upiTransactionId || item.upiTransactionId }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating payment status in database:', error);
      throw error;
    }
  };

  return (
    <TallyContext.Provider value={{ tallyItems, addTallyItem, updatePaymentStatus }}>
      {children}
    </TallyContext.Provider>
  );
};

export const useTally = () => {
  const context = useContext(TallyContext);
  if (context === undefined) {
    throw new Error('useTally must be used within a TallyProvider');
  }
  return context;
};
