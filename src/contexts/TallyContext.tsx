import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

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

  const addTallyItem = (item: Omit<TallyItem, 'id' | 'paymentDate' | 'upiTransactionId'> & { paymentStatus?: 'pending' | 'completed' | 'failed' | 'cancelled' }): TallyItem => {
    const newItem: TallyItem = {
      ...item,
      id: uuidv4(),
      paymentStatus: item.paymentStatus || 'pending',
      paymentDate: new Date().toISOString(),
      upiTransactionId: undefined
    };
    setTallyItems(prev => [...prev, newItem]);
    return newItem;
  };

  const updatePaymentStatus = (id: string, status: 'completed' | 'failed' | 'cancelled', upiTransactionId?: string) => {
    setTallyItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, paymentStatus: status, upiTransactionId: upiTransactionId || item.upiTransactionId }
          : item
      )
    );
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
