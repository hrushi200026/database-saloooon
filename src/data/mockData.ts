// Mock data for the salon management system

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  visitCount: number;
  lastVisit: string;
  totalSpent: number;
  preferredServices: string[];
  notes: string;
  photo: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  rating: number;
  photo: string;
  available: boolean;
  nextAvailable: string;
  workingHours: {
    start: string;
    end: string;
  };
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  description: string;
  brand: string;
}

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

export interface Transaction {
  id: string;
  customerId: string;
  employeeId: string;
  type: 'service' | 'product';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  date: string;
}

// Helper function to get date strings for the last 3 days
const getDateStrings = () => {
  const today = new Date();
  const dates = [];
  
  for (let i = 1; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

const [yesterday, twoDaysAgo, threeDaysAgo] = getDateStrings();

// Mock customers
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Rahul Deshpande',
    phone: '+91 98765 43210',
    photo: 'public/profile images for customer/1.jpeg',
    email: 'rahul.d@example.com',
    gender: 'male',
    visitCount: 12,
    lastVisit: '2024-06-28',
    totalSpent: 12500,
    preferredServices: ['Haircut & Style', 'Hair Color'],
    notes: 'Prefers natural hair colors, allergic to ammonia'
  },
  {
    id: '2',
    name: 'Priya Patel',
    phone: '+91 98765 43211',
    photo: 'public/profile images for customer/2.jpeg',
    email: 'priya.j@example.com',
    gender: 'female',
    visitCount: 8,
    lastVisit: '2024-06-25',
    totalSpent: 8900,
    preferredServices: ['Facial Treatment', 'Eyebrow Threading'],
    notes: 'Sensitive skin, prefers organic products'
  },
  {
    id: '3',
    name: 'Aarav Sharma',
    phone: '+91 98765 43212',
    photo: 'public/profile images for customer/3.png',
    email: 'aarav.s@example.com',
    gender: 'male',
    visitCount: 5,
    lastVisit: '2024-06-29',
    totalSpent: 4500,
    preferredServices: ['Hair Spa', 'Beard Trim'],
    notes: 'Prefers morning appointments'
  },
  {
    id: '4',
    name: 'Ishaan Patel',
    phone: '+91 88776 65544',
    photo: 'public/profile images for customer/4.png',
    email: 'ishaan.p@example.com',
    gender: 'male',
    visitCount: 3,
    lastVisit: '2024-06-27',
    totalSpent: 3200,
    preferredServices: ['Haircut & Style', 'Hair Color'],
    notes: 'Likes to try new styles'
  },
  {
    id: '5',
    name: 'Ananya Gupta',
    phone: '+91 99887 76655',
    photo: 'public/profile images for customer/5.jpeg',
    email: 'ananya.g@example.com',
    gender: 'female',
    visitCount: 10,
    lastVisit: '2024-06-30',
    totalSpent: 15000,
    preferredServices: ['Bridal Makeup', 'Hair Styling'],
    notes: 'VIP customer, books in advance'
  },
  {
    id: '6',
    name: 'Vihaan Kumar',
    phone: '+91 98765 43211',
    photo: 'public/profile images for customer/6.jpeg',
    email: 'vihaan.k@example.com',
    gender: 'male',
    visitCount: 7,
    lastVisit: '2024-06-26',
    totalSpent: 5600,
    preferredServices: ['Haircut', 'Facial'],
    notes: 'Prefers senior stylist'
  },
  {
    id: '7',
    name: 'Aditi Nair',
    phone: '+91 88776 65545',
    photo: 'public/profile images for customer/7.png',
    email: 'aditi.n@example.com',
    gender: 'female',
    visitCount: 2,
    lastVisit: '2024-06-28',
    totalSpent: 1800,
    preferredServices: ['Manicure', 'Pedicure'],
    notes: 'First time customer, interested in packages'
  },
  {
    id: '8',
    name: 'Arjun Singh',
    phone: '+91 99887 76656',
    photo: 'public/profile images for customer/8.jpeg',
    email: 'arjun.s@example.com',
    gender: 'male',
    visitCount: 15,
    lastVisit: '2024-06-29',
    totalSpent: 22000,
    preferredServices: ['Hair Color', 'Hair Treatment'],
    notes: 'Regular customer, refers friends'
  },
  {
    id: '9',
    name: 'Saanvi Iyer',
    phone: '+91 98765 43218',
    photo: 'public/profile images for customer/9.jpeg',
    email: 'saanvi.i@example.com',
    gender: 'female',
    visitCount: 4,
    lastVisit: '2024-06-25',
    totalSpent: 3200,
    preferredServices: ['Threading', 'Facial'],
    notes: 'Prefers female staff'
  },
  {
    id: '10',
    name: 'Vivaan Joshi',
    phone: '+91 88776 65546',
    photo: 'public/profile images for customer/10.jpeg',
    email: 'vivaan.j@example.com',
    gender: 'male',
    visitCount: 1,
    lastVisit: '2024-06-30',
    totalSpent: 800,
    preferredServices: ['Haircut'],
    notes: 'New customer, walk-in'
  },
  {
    id: '11',
    name: 'Anika Reddy',
    phone: '+91 99887 76657',
    photo: 'public/profile images for customer/11.jpeg',
    email: 'anika.r@example.com',
    gender: 'female',
    visitCount: 9,
    lastVisit: '2024-06-29',
    totalSpent: 12500,
    preferredServices: ['Keratin Treatment', 'Hair Spa'],
    notes: 'Comes every month for treatments'
  },
  {
    id: '12',
    name: 'Reyansh Malhotra',
    phone: '+91 98765 43213',
    photo: 'public/profile images for customer/12.jpeg',
    email: 'reyansh.m@example.com',
    gender: 'male',
    visitCount: 6,
    lastVisit: '2024-06-27',
    totalSpent: 4800,
    preferredServices: ['Beard Styling', 'Haircut'],
    notes: 'Prefers specific barber'
  },
  {
    id: '13',
    name: 'Sara Khan',
    phone: '+91 88776 65547',
    photo: 'public/profile images for customer/13.jpeg',
    email: 'sara.k@example.com',
    gender: 'female',
    visitCount: 3,
    lastVisit: '2024-06-26',
    totalSpent: 2700,
    preferredServices: ['Bridal Makeup', 'Hair Styling'],
    notes: 'Books for special occasions'
  },
  {
    id: '14',
    name: 'Ayaan Kapoor',
    phone: '+91 99887 76658',
    photo: 'public/profile images for customer/14.jpeg',
    email: 'ayaan.k@example.com',
    gender: 'male',
    visitCount: 11,
    lastVisit: '2024-06-30',
    totalSpent: 16500,
    preferredServices: ['Hair Color', 'Hair Treatment'],
    notes: 'VIP customer, prefers organic products'
  },
  {
    id: '15',
    name: 'Kavya Nair',
    phone: '+91 98765 43214',
    photo: 'public/profile images for customer/15.jpeg',
    email: 'kavya.n@example.com',
    gender: 'female',
    visitCount: 2,
    lastVisit: '2024-06-28',
    totalSpent: 1200,
    preferredServices: ['Threading', 'Facial'],
    notes: 'New customer, interested in packages'
  },
  {
    id: '16',
    name: 'Advait Desai',
    phone: '+91 88776 65548',
    photo: 'public/profile images for customer/16.jpeg',
    email: 'advait.d@example.com',
    gender: 'male',
    visitCount: 8,
    lastVisit: '2024-06-29',
    totalSpent: 9600,
    preferredServices: ['Haircut', 'Beard Trim'],
    notes: 'Regular customer, refers colleagues'
  },
  {
    id: '17',
    name: 'Anvi Choudhary',
    phone: '+91 99887 76659',
    photo: 'public/profile images for customer/17.jpeg',
    email: 'anvi.c@example.com',
    gender: 'female',
    visitCount: 5,
    lastVisit: '2024-06-27',
    totalSpent: 3800,
    preferredServices: ['Manicure', 'Pedicure'],
    notes: 'Prefers specific nail artist'
  },
  {
    id: '18',
    name: 'Dhruv Mehta',
    phone: '+91 98765 43215',
    photo: 'public/profile images for customer/18.jpeg',
    email: 'dhruv.m@example.com',
    gender: 'male',
    visitCount: 12,
    lastVisit: '2024-06-30',
    totalSpent: 14200,
    preferredServices: ['Hair Spa', 'Facial'],
    notes: 'VIP customer, books in advance'
  },
  {
    id: '19',
    name: 'Ira Khanna',
    phone: '+91 88776 65549',
    email: 'ira.k@example.com',
    gender: 'female',
    visitCount: 1,
    lastVisit: '2024-06-29',
    totalSpent: 1500,
    preferredServices: ['Haircut', 'Blow Dry'],
    notes: 'New customer, walk-in',
    photo: 'public/profile images for customer/19.jpeg'
  },
  {
    id: '20',
    name: 'Kabir Sethi',
    phone: '+91 99887 76660',
    email: 'kabir.s@example.com',
    gender: 'male',
    visitCount: 7,
    lastVisit: '2024-06-28',
    totalSpent: 5200,
    preferredServices: ['Hair Color', 'Haircut'],
    notes: 'Regular customer, prefers specific stylist',
    photo: 'public/profile images for customer/20.png'
  },
  {
    id: '21',
    name: 'Myra Agarwal',
    phone: '+91 98765 43216',
    email: 'myra.a@example.com',
    gender: 'female',
    visitCount: 3,
    lastVisit: '2024-06-27',
    totalSpent: 2900,
    preferredServices: ['Facial', 'Threading'],
    notes: 'Interested in monthly packages',
    photo: 'public/profile images for customer/21.jpeg'
  },
  {
    id: '22',
    name: 'Vihaan Reddy',
    phone: '+91 88776 65550',
    email: 'vihaan.r@example.com',
    gender: 'male',
    visitCount: 9,
    lastVisit: '2024-06-30',
    totalSpent: 10800,
    preferredServices: ['Hair Treatment', 'Beard Styling'],
    notes: 'Regular customer, refers friends',
    photo: 'public/profile images for customer/22.jpeg'
  },
  {
    id: '23',
    name: 'Ananya Malhotra',
    phone: '+91 99887 76661',
    email: 'ananya.m@example.com',
    gender: 'female',
    visitCount: 4,
    lastVisit: '2024-06-29',
    totalSpent: 3400,
    preferredServices: ['Bridal Makeup', 'Hair Styling'],
    notes: 'Books for special occasions',
    photo: 'public/profile images for customer/23.jpeg'
  }
];

// Mock employees
export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Rajesh Kulkarni',
    role: 'Senior Stylist',
    specialties: ['Hair Coloring', 'Balayage', 'Ombre'],
    rating: 4.9,
    photo: '/Profile images for staff/1a.png',
    available: true,
    nextAvailable: '2024-07-05T14:30:00',
    workingHours: {
      start: '09:00',
      end: '18:00'
    }
  },
  {
    id: '2',
    name: 'Priyanka Patil',
    role: 'Master Barber',
    specialties: ['Beard Trim', 'Classic Cuts', 'Hot Towel Shave'],
    rating: 4.8,
    photo: '/Profile images for staff/2a.png',
    available: true,
    nextAvailable: '2024-07-04T11:00:00',
    workingHours: {
      start: '10:00',
      end: '19:00'
    }
  },
  {
    id: '3',
    name: 'Sandeep Deshmukh',
    role: 'Spa Therapist',
    specialties: ['Deep Tissue Massage', 'Facials', 'Waxing'],
    rating: 4.7,
    photo: '/Profile images for staff/3a.jpeg',
    available: false,
    nextAvailable: '2024-07-06T10:00:00',
    workingHours: {
      start: '11:00',
      end: '20:00'
    }
  }
];

// Mock services
export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Haircut & Style',
    duration: 60,
    price: 500,
    category: 'Hair',
    description: 'Professional haircut and styling with blow dry'
  },
  {
    id: '2',
    name: 'Hair Color',
    duration: 120,
    price: 3500,
    category: 'Hair',
    description: 'Full hair coloring with premium products'
  },
  {
    id: '3',
    name: 'Facial Treatment',
    duration: 90,
    price: 2500,
    category: 'Skin Care',
    description: 'Deep cleansing facial with mask and massage'
  },
  {
    id: '4',
    name: 'Manicure',
    duration: 45,
    price: 800,
    category: 'Nails',
    description: 'Classic manicure with nail shaping and polish'
  },
  {
    id: '5',
    name: 'Pedicure',
    duration: 60,
    price: 1000,
    category: 'Nails',
    description: 'Relaxing pedicure with foot soak and massage'
  },
  {
    id: '6',
    name: 'Beard Trim',
    duration: 30,
    price: 300,
    category: 'Grooming',
    description: 'Precision beard trim and shaping'
  },
  {
    id: '7',
    name: 'Hair Spa',
    duration: 90,
    price: 2000,
    category: 'Hair',
    description: 'Deep conditioning hair spa treatment'
  },
  {
    id: '8',
    name: 'Waxing',
    duration: 30,
    price: 600,
    category: 'Skin Care',
    description: 'Professional waxing service'
  },
  {
    id: '9',
    name: 'Eyebrow Threading',
    duration: 15,
    price: 200,
    category: 'Grooming',
    description: 'Precise eyebrow shaping with threading'
  },
  {
    id: '10',
    name: 'Makeup Application',
    duration: 60,
    price: 3500,
    category: 'Makeup',
    description: 'Professional makeup application for any occasion'
  }
];

// Mock products
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Professional Shampoo',
    price: 450,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
    category: 'Hair Care',
    stock: 25,
    description: 'Sulfate-free professional shampoo for all hair types',
    brand: 'SalonPro'
  },
  {
    id: '2',
    name: 'Hydrating Hair Mask',
    price: 650,
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop',
    category: 'Hair Care',
    stock: 18,
    description: 'Deep conditioning mask for dry and damaged hair',
    brand: 'SalonPro'
  },
  {
    id: '3',
    name: 'Anti-Aging Serum',
    price: 1250,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop',
    category: 'Skincare',
    stock: 12,
    description: 'Premium anti-aging serum with vitamin C and retinol',
    brand: 'BeautyLux'
  },
  {
    id: '4',
    name: 'Nail Polish Set',
    price: 350,
    image: 'https://images.unsplash.com/photo-1586706040906-c5250b9241e3?w=300&h=300&fit=crop',
    category: 'Nail Care',
    stock: 30,
    description: 'Set of 5 trending nail polish colors',
    brand: 'ColorPop'
  }
];

// Mock appointments
export const mockAppointments: Appointment[] = [
  {
    id: '1',
    customerId: '1',
    employeeId: '1',
    serviceIds: ['1', '2'],
    date: '2024-07-05',
    time: '10:00 AM',
    status: 'scheduled',
    total: 4000,
    notes: 'Customer wants a slight trim and highlights'
  },
  {
    id: '2',
    customerId: '2',
    employeeId: '2',
    serviceIds: ['3'],
    date: '2024-07-05',
    time: '2:00 PM',
    status: 'scheduled',
    total: 2500,
    notes: 'Regular monthly facial'
  }
];

// Mock transactions
export const mockTransactions: Transaction[] = [
  // Yesterday
  {
    id: 't1',
    customerId: '1',
    employeeId: '1',
    type: 'service',
    items: [
      { id: '1', name: 'Haircut & Style', quantity: 1, price: 500 },
      { id: '2', name: 'Hair Color', quantity: 1, price: 3500 }
    ],
    total: 4000,
    paymentMethod: 'card',
    date: `${yesterday}T14:30:00`
  },
  {
    id: 't2',
    customerId: '2',
    employeeId: '2',
    type: 'service',
    items: [
      { id: '3', name: 'Facial Treatment', quantity: 1, price: 2500 },
      { id: '9', name: 'Eyebrow Threading', quantity: 1, price: 200 }
    ],
    total: 2700,
    paymentMethod: 'upi',
    date: `${yesterday}T11:15:00`
  },
  // Two days ago
  {
    id: 't3',
    customerId: '3',
    employeeId: '1',
    type: 'service',
    items: [
      { id: '1', name: 'Haircut & Style', quantity: 1, price: 500 },
      { id: '4', name: 'Manicure', quantity: 1, price: 800 }
    ],
    total: 1300,
    paymentMethod: 'cash',
    date: `${twoDaysAgo}T16:45:00`
  },
  {
    id: 't4',
    customerId: '4',
    employeeId: '3',
    type: 'service',
    items: [
      { id: '3', name: 'Facial Treatment', quantity: 1, price: 2500 }
    ],
    total: 2500,
    paymentMethod: 'card',
    date: `${twoDaysAgo}T10:30:00`
  },
  // Three days ago
  {
    id: 't5',
    customerId: '5',
    employeeId: '2',
    type: 'service',
    items: [
      { id: '6', name: 'Beard Trim', quantity: 1, price: 300 },
      { id: '7', name: 'Hair Spa', quantity: 1, price: 1200 }
    ],
    total: 1500,
    paymentMethod: 'upi',
    date: `${threeDaysAgo}T15:20:00`
  },
  {
    id: 't6',
    customerId: '6',
    employeeId: '1',
    type: 'product',
    items: [
      { id: '1', name: 'Professional Shampoo', quantity: 2, price: 45 },
      { id: '2', name: 'Hydrating Hair Mask', quantity: 1, price: 65 }
    ],
    total: 155,
    paymentMethod: 'cash',
    date: `${threeDaysAgo}T12:00:00`
  }
];

// Analytics data
export const mockAnalytics = {
  todayRevenue: 1250,
  weeklyRevenue: 8500,
  monthlyRevenue: 35000,
  todayAppointments: 12,
  weeklyAppointments: 89,
  monthlyAppointments: 350,
  topServices: [
    { name: 'Haircut & Style', count: 45, revenue: 3375 },
    { name: 'Hair Color', count: 28, revenue: 4200 },
    { name: 'Facial Treatment', count: 35, revenue: 4200 },
    { name: 'Manicure & Pedicure', count: 22, revenue: 1870 }
  ],
  topEmployees: [
    { name: 'Maria Rodriguez', appointments: 89, revenue: 12500 },
    { name: 'Anna Chen', appointments: 67, revenue: 9800 },
    { name: 'Sophie Turner', appointments: 45, revenue: 6700 }
  ]
};