import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, isSameDay, isSameMonth, isSameYear } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DownloadDataTab } from '@/components/DownloadDataTab';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethod } from "@/contexts/TallyContext";
import { toast } from "sonner";
import { 
  Award,
  Bell, 
  Calendar, 
  Clock, 
  CreditCard, 
  DollarSign, 
  Loader2, 
  Mail, 
  Phone, 
  Plus, 
  Scissors,
  Search, 
  Star,
  Store, 
  TrendingDown, 
  TrendingUp, 
  User,
  Users, 
  CalendarDays, 
  Filter,
  BarChart3,
  X
} from "lucide-react";
import { PaymentDialog } from "@/components/PaymentDialog";
import { AddCustomerButton } from "@/components/AddCustomerButton";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useTally } from "@/contexts/TallyContext";
import { useCustomers } from "@/contexts/CustomersContext";
import { useStaff } from "@/contexts/StaffContext";
import { mockCustomers as initialMockCustomers, mockServices, mockTransactions } from "@/data/mockData";
import { Appointment, Customer, Service } from "@/data/mockData";

// Format price with Indian Rupee symbol and Indian number format
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
};

// Format phone number to Indian format
const formatPhoneNumber = (phone: string) => {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{5})$/);
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]}`;
  }
  return phone;
};

// Image modal component
const ImageModal = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => {
  const handleBackdropClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key press
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Prevent touch events from propagating to parent elements
  const handleTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  // Add and remove event listeners
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out touch-none"
      onClick={handleBackdropClick}
      onTouchStart={handleBackdropClick}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col touch-none">
        <div className="flex justify-end mb-2">
          <button 
            onClick={onClose}
            onTouchStart={(e) => e.stopPropagation()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors touch-auto"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden rounded-lg bg-white touch-none">
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-contain max-h-[calc(90vh-60px)] touch-none select-none"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState<Date>(new Date());
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'day' | 'month' | 'year'>('day');
  const handleAnalyticsPeriodChange = (value: 'day' | 'month' | 'year') => {
    setAnalyticsPeriod(value);
  };
  const [customerSearch, setCustomerSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState("recent");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  
  const { appointments, updateAppointment } = useAppointments();
  const { tallyItems, addTallyItem, updatePaymentStatus } = useTally();
  const { customers } = useCustomers();
  const { employees } = useStaff();
  const navigate = useNavigate();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);
  
  // Helper function to get formatted period text
  const getPeriodText = () => {
    const today = new Date();
    if (analyticsPeriod === 'day') {
      if (isSameDay(selectedDate, today)) return 'Today';
      return format(selectedDate, 'MMM d, yyyy');
    } else if (analyticsPeriod === 'month') {
      if (isSameMonth(selectedMonth, today) && isSameYear(selectedMonth, today)) return 'This Month';
      return format(selectedMonth, 'MMM yyyy');
    } else {
      if (isSameYear(selectedYear, today)) return 'This Year';
      return format(selectedYear, 'yyyy');
    }
  };

  const [selectedAppointment, setSelectedAppointment] = useState<{
    id: string;
    customerName: string;
    customerPhone: string;
    amount: number;
  } | null>(null);

  const handlePaymentSuccess = async (paymentDetails: {
    amount: number;
    paymentMethod: string;
    paymentStatus: 'completed' | 'pending' | 'failed';
  }) => {
    if (!selectedAppointment) return;
    
    try {
      // Update the appointment status to completed
      await updateAppointment(selectedAppointment.id, { 
        status: 'completed' 
      });
      
      // Find the appointment details
      const appointment = appointments.find(a => a.id === selectedAppointment.id);
      if (!appointment) return;
      
      // Add to tally
      const customer = customers.find(c => c.id === appointment.customerId);
      const employee = employees.find(e => e.id === appointment.employeeId);
      
      if (customer && employee) {
        addTallyItem({
          date: appointment.date,
          time: appointment.time,
          customerName: customer.name,
          customerPhone: customer.phone,
          staffName: employee.name,
          services: appointment.serviceIds
            .map(id => ({
              name: mockServices.find(s => s.id === id)?.name || 'Unknown Service',
              price: mockServices.find(s => s.id === id)?.price || 0
            }))
            .filter(service => service.name !== 'Unknown Service'),
          totalCost: paymentDetails.amount,
          paymentMethod: paymentDetails.paymentMethod as 'cash' | 'card' | 'upi',
          paymentStatus: 'completed'
        });
      }
      
      // Show success message
      toast.success('Payment processed successfully');
      setPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };
  
  // Get today's appointments and sort them by status (cancelled last, then completed, then by time)
  const todaysAppointments = appointments
    .filter(
      (appointment) =>
        appointment.date === format(selectedDate, "yyyy-MM-dd")
    )
    .sort((a, b) => {
      // Sort by status (cancelled last, then completed, then by time)
      if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
      if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return a.time.localeCompare(b.time);
    });

  // State for gender filter
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  
  // Calculate stats
  const totalCustomers = customers.length;
  const newCustomersThisMonth = customers.filter(customer => {
    const customerDate = new Date(customer.lastVisit);
    const currentDate = new Date();
    return customerDate.getMonth() === currentDate.getMonth() && 
           customerDate.getFullYear() === currentDate.getFullYear();
  }).length;

  // Calculate revenue data for the last 4 days (today + 3 previous days)
  const getRevenueData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // For the current day, use real data from tallyItems
    const todayRevenue = tallyItems
      .filter(item => {
        const itemDate = new Date(item.paymentDate);
        itemDate.setHours(0, 0, 0, 0);
        return (
          item.paymentStatus === 'completed' &&
          itemDate.getTime() === today.getTime()
        );
      })
      .reduce((sum, item) => sum + item.totalCost, 0);
    
    // For previous days, use mock data
    const getPreviousDate = (daysAgo: number) => {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      return date;
    };
    
    const mockRevenueData = [1, 2, 3].map(daysAgo => {
      const date = getPreviousDate(daysAgo);
      const dateStr = date.toISOString().split('T')[0];
      return {
        date: date,
        revenue: mockTransactions
          .filter(tx => tx.date.startsWith(dateStr))
          .reduce((sum, tx) => sum + tx.total, 0)
      };
    });
    
    // Combine real and mock data
    return [
      { date: today, revenue: todayRevenue },
      ...mockRevenueData
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
  };
  
  const revenueData = getRevenueData();
  const todaysRevenue = revenueData[0]?.revenue || 0;
  
  // Calculate revenue change from yesterday
  const revenueChange = revenueData.length > 1 
    ? Math.round(((revenueData[0].revenue - revenueData[1].revenue) / (revenueData[1].revenue || 1)) * 100) 
    : 0;

  // Filter customers based on search term and gender
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.phone.includes(customerSearch);
    
    const matchesGender = 
      genderFilter === 'all' || 
      (genderFilter === 'male' && customer.gender === 'male') || 
      (genderFilter === 'female' && customer.gender === 'female');
    
    return matchesSearch && matchesGender;
  });

  // Filter and sort transactions
  const filteredTransactions = mockTransactions
    .filter(transaction => {
      const matchesSearch = initialMockCustomers.find(c => c.id === transaction.customerId)?.name
        .toLowerCase().includes(transactionSearch.toLowerCase());
      const matchesDate = !transactionDate || transaction.date === format(transactionDate, "yyyy-MM-dd");
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "max-amount": return b.total - a.total;
        case "min-amount": return a.total - b.total;
        case "recent": return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest": return new Date(a.date).getTime() - new Date(b.date).getTime();
        default: return 0;
      }
    });

  const handleImageClick = (e: React.MouseEvent | React.TouchEvent, src: string, alt: string) => {
    e.stopPropagation();
    e.preventDefault();
    setZoomedImage({ src, alt });
  };

  return (
    <div className="space-y-6">
      {zoomedImage && (
        <ImageModal 
          src={zoomedImage.src} 
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}
      {zoomedImage && (
        <ImageModal 
          src={zoomedImage.src} 
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}
      {/* Welcome Section with Date Picker */}
      <div className="bg-gradient-hero rounded-2xl p-6 text-white shadow-glow">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to SalonPro</h1>
            <p className="text-white/90">
              Manage your salon operations, bookings, and customer relationships all in one place.
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Calendar className="h-4 w-4 mr-2" />
                {format(selectedDate, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative group">
            <div className="absolute -top-1 right-3 bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs text-muted-foreground z-10 rounded-md border border-border/50">
              {format(new Date(), 'EEE, MMM d')}
            </div>
            <StatsCard
              title="Today's Revenue"
              value={formatPrice(tallyItems
                .filter(item => item.date === format(new Date(), 'yyyy-MM-dd') && item.paymentStatus === 'completed')
                .reduce((sum, item) => sum + item.totalCost, 0)
              )}
              description="Total earnings for today"
              icon={<DollarSign className="h-4 w-4 mt-1" />}
              className="pt-1 relative z-0"
            />
          </div>
          <div className="relative group">
            <div className="absolute -top-1 right-3 bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs text-muted-foreground z-10 rounded-md border border-border/50">
              {format(new Date(), 'EEE, MMM d')}
            </div>
            <StatsCard
              title="Appointments Today"
              value={todaysAppointments.length.toString()}
              description={todaysAppointments.length === 1 ? '1 appointment' : `${todaysAppointments.length} appointments`}
              icon={<Calendar className="h-4 w-4 mt-1" />}
              className="pt-1 relative z-0"
            />
          </div>
          <div className="relative group">
            <div className="absolute -top-1 right-3 bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs text-muted-foreground z-10 rounded-md border border-border/50">
              {format(new Date(), 'EEE, MMM d')}
            </div>
            <StatsCard
              title="Available Staff"
              value={employees.filter(e => e.available).length.toString()}
              description={`${employees.length} total employees`}
              icon={<Users className="h-4 w-4 mt-1" />}
              className="pt-1 relative z-0"
            />
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {(() => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekStart = format(weekAgo, 'MMM d');
          const weekEnd = format(new Date(), 'MMM d, yyyy');
          
          return (
            <div className="relative group">
              <div className="absolute -top-1 right-3 bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs text-muted-foreground z-10 rounded-md border border-border/50">
                {`${weekStart} - ${weekEnd}`}
              </div>
              <StatsCard
                title="Weekly Revenue"
                value={formatPrice(tallyItems.reduce((sum, item) => {
                  const itemDate = new Date(item.paymentDate);
                  return itemDate > weekAgo ? sum + item.totalCost : sum;
                }, 0))}
                description="Last 7 days"
                icon={<TrendingUp className="h-4 w-4 mt-1" />}
                className="pt-1 relative z-0"
              />
            </div>
          );
        })()}
        
        {(() => {
          const currentMonth = format(new Date(), 'MMMM');
          const currentYear = new Date().getFullYear();
          
          return (
            <div className="relative group">
              <div className="absolute -top-1 right-3 bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs text-muted-foreground z-10 rounded-md border border-border/50">
                {`${currentMonth} ${currentYear}`}
              </div>
              <StatsCard
                title="Monthly Revenue"
                value={formatPrice(tallyItems.reduce((sum, item) => {
                  const itemDate = new Date(item.paymentDate);
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return itemDate > monthAgo ? sum + item.totalCost : sum;
                }, 0))}
                description="Last 30 days"
                icon={<DollarSign className="h-4 w-4 mt-1" />}
                className="pt-1 relative z-0"
              />
            </div>
          );
        })()}
        
        {(() => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekStart = format(weekAgo, 'MMM d');
          const weekEnd = format(new Date(), 'MMM d, yyyy');
          
          return (
            <div className="relative group">
              <div className="absolute -top-1 right-3 bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs text-muted-foreground z-10 rounded-md border border-border/50">
                {`${weekStart} - ${weekEnd}`}
              </div>
              <StatsCard
                title="Weekly Appointments"
                value={appointments.filter(apt => {
                  const aptDate = new Date(apt.date);
                  return aptDate > weekAgo;
                }).length.toString()}
                description="Last 7 days"
                icon={<Calendar className="h-4 w-4 mt-1" />}
                className="pt-1 relative z-0"
              />
            </div>
          );
        })()}
      </div>

      {/* Admin Dashboard Tabs */}
      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Today's Appointments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="download">Download Data</TabsTrigger>
        </TabsList>

        {/* Today's Appointments Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Today's Appointments</h3>
              <p className="text-muted-foreground">Manage and track today's schedule</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {format(selectedDate, "MMMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Today's Appointments List */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {todaysAppointments.length > 0 ? (
                    todaysAppointments.map((appointment) => {
                      const customer = customers.find(c => c.id === appointment.customerId);
                      const employee = employees.find(e => e.id === appointment.employeeId);
                      
                      if (!customer || !employee) return null;
                      
                      const services = appointment.serviceIds
                        .map(id => mockServices.find(s => s.id === id)?.name)
                        .filter(Boolean);
                      
                      return (
                        <div 
                          key={appointment.id} 
                          className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                            appointment.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/10' : ''
                          }`}
                          onClick={() => {
                            // Handle appointment click (e.g., show details)
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                                  {customer.photo ? (
                                    <img 
                                      src={`/${customer.photo}`} 
                                      alt={customer.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to initial if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = '';
                                        target.parentElement!.innerHTML = customer.name.charAt(0).toUpperCase();
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                      {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium">{customer.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {services.join(', ')}
                                </p>
                                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {appointment.time}
                                  <span className="mx-2">•</span>
                                  <User className="h-3 w-3 mr-1" />
                                  {employee.name}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge 
                                variant={
                                  appointment.status === 'completed' ? 'default' : 
                                  appointment.status === 'cancelled' ? 'destructive' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </Badge>
                              <div className="text-right">
                                <p className="font-medium">₹{appointment.total.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          </div>
                          
                          {appointment.status === 'scheduled' && (
                            <div className="flex justify-end space-x-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const customer = customers.find(c => c.id === appointment.customerId);
                                  const employee = employees.find(e => e.id === appointment.employeeId);
                                  
                                  if (customer && employee) {
                                    setSelectedAppointment({
                                      id: appointment.id,
                                      customerName: customer.name,
                                      customerPhone: customer.phone,
                                      amount: appointment.total
                                    });
                                    setPaymentDialogOpen(true);
                                  }
                                }}
                              >
                                Pay ₹{appointment.total.toLocaleString('en-IN')}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const customer = customers.find(c => c.id === appointment.customerId);
                                  const employee = employees.find(e => e.id === appointment.employeeId);
                                  
                                  if (customer && employee) {
                                    try {
                                      // Update appointment status to cancelled
                                      await updateAppointment(appointment.id, { 
                                        status: 'cancelled' 
                                      });
                                      
                                      // Add to Tally with cancelled status
                                      addTallyItem({
                                        date: appointment.date,
                                        time: appointment.time,
                                        customerName: customer.name,
                                        customerPhone: customer.phone,
                                        staffName: employee.name,
                                        services: appointment.serviceIds
                                          .map(id => ({
                                            name: mockServices.find(s => s.id === id)?.name || 'Unknown Service',
                                            price: mockServices.find(s => s.id === id)?.price || 0
                                          }))
                                          .filter(service => service.name !== 'Unknown Service'),
                                        totalCost: appointment.total,
                                        paymentMethod: 'cash',
                                        paymentStatus: 'cancelled' as const
                                      });
                                    } catch (error) {
                                      console.error('Error cancelling appointment:', error);
                                      // Handle error (e.g., show a toast notification)
                                    }
                                  }
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No appointments scheduled for today</p>
                      <Button variant="ghost" className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Appointment
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Transaction Logs</h3>
              <p className="text-muted-foreground">Payment records and transaction history</p>
            </div>
            <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customer">Customer</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {initialMockCustomers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="employee">Employee</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" placeholder="Transaction amount" />
                  </div>
                  <div>
                    <Label htmlFor="payment">Payment Method</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsAddTransactionOpen(false)}>Add Transaction</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  {transactionDate ? format(transactionDate, "MMM dd, yyyy") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={transactionDate}
                  onSelect={setTransactionDate}
                  initialFocus
                  className="pointer-events-auto"
                />
                {transactionDate && (
                  <div className="p-2 border-t flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setTransactionDate(undefined)}
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="max-amount">Highest Amount</SelectItem>
                <SelectItem value="min-amount">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Transactions List with Scrollable Area */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      // Filter and count valid transactions
                      let filteredTransactions = tallyItems.filter(tx => 
                        tx && tx.customerName && tx.staffName && tx.services && tx.services.length > 0 && tx.totalCost > 0
                      );
                      
                      // Apply search filter if there's a search term
                      if (transactionSearch) {
                        const searchLower = transactionSearch.toLowerCase().trim();
                        filteredTransactions = filteredTransactions.filter(tx => 
                          (tx.customerName && tx.customerName.toLowerCase().includes(searchLower)) ||
                          (tx.staffName && tx.staffName.toLowerCase().includes(searchLower)) ||
                          (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(searchLower)) ||
                          (tx.services && tx.services.some(s => 
                            s.name && s.name.toLowerCase().includes(searchLower)
                          ))
                        );
                      }
                      
                      // Apply date filter if a date is selected
                      if (transactionDate) {
                        const dateStr = format(transactionDate, 'yyyy-MM-dd');
                        filteredTransactions = filteredTransactions.filter(tx => tx.date === dateStr);
                      }
                      
                      const count = filteredTransactions.length;
                      return `${count} transaction${count !== 1 ? 's' : ''} found`;
                    })()}
                  </div>
                </div>
              </div>
              
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {(() => {
                    // Filter out any invalid or empty transactions
                    let filteredTransactions = tallyItems.filter(tx => 
                      tx && tx.customerName && tx.staffName && tx.services && tx.services.length > 0 && tx.totalCost > 0
                    );
                    
                    // Apply search filter if there's a search term
                    if (transactionSearch) {
                      const searchLower = transactionSearch.toLowerCase().trim();
                      filteredTransactions = filteredTransactions.filter(tx => 
                        (tx.customerName && tx.customerName.toLowerCase().includes(searchLower)) ||
                        (tx.staffName && tx.staffName.toLowerCase().includes(searchLower)) ||
                        (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(searchLower)) ||
                        (tx.services && tx.services.some(s => 
                          s.name && s.name.toLowerCase().includes(searchLower)
                        ))
                      );
                    }
                    
                    // Apply date filter if a date is selected
                    if (transactionDate) {
                      const dateStr = format(transactionDate, 'yyyy-MM-dd');
                      filteredTransactions = filteredTransactions.filter(tx => tx.date === dateStr);
                    }
                    
                    // Sort transactions
                    filteredTransactions.sort((a, b) => {
                      const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
                      const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
                      
                      // If either date is invalid, move it to the end
                      if (isNaN(dateA.getTime())) return 1;
                      if (isNaN(dateB.getTime())) return -1;
                      
                      switch(sortBy) {
                        case 'recent':
                          return dateB.getTime() - dateA.getTime();
                        case 'oldest':
                          return dateA.getTime() - dateB.getTime();
                        case 'max-amount':
                          return (b.totalCost || 0) - (a.totalCost || 0);
                        case 'min-amount':
                          return (a.totalCost || 0) - (b.totalCost || 0);
                        default:
                          return dateB.getTime() - dateA.getTime();
                      }
                    });
                    
                    if (filteredTransactions.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12">
                          <CreditCard className="h-12 w-12 text-muted-foreground mb-3" />
                          <h4 className="font-medium">No transactions found</h4>
                          <p className="text-sm text-muted-foreground text-center max-w-xs">
                            {transactionSearch || transactionDate 
                              ? 'Try adjusting your search or filter criteria' 
                              : 'No transactions have been recorded yet'}
                          </p>
                        </div>
                      );
                    }
                    
                    return filteredTransactions.map((transaction, index) => {
                      const transactionKey = `tx-${transaction.date}-${transaction.time || 'notime'}-${transaction.customerName}-${index}`;
                      
                      return (
                        <div key={transactionKey} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mt-1 flex-shrink-0">
                                <DollarSign className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium">{transaction.customerName || 'Unknown Customer'}</h4>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.staffName && `Served by ${transaction.staffName} • `}
                                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                  {transaction.time && ` • ${transaction.time}`}
                                </div>
                                {transaction.paymentMethod && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {transaction.paymentMethod}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-semibold">
                                {formatPrice(transaction.totalCost || 0)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                              </div>
                            </div>
                          </div>
                          
                          {transaction.services && transaction.services.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="space-y-2">
                                {transaction.services.map((service, idx) => (
                                  <div key={`service-${idx}`} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{service.name || 'Unnamed Service'}</span>
                                    <span>{formatPrice(service.price || 0)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Business Analytics</h3>
              <p className="text-muted-foreground">Detailed performance metrics and insights</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2">
                <Select 
                  value={analyticsPeriod} 
                  onValueChange={handleAnalyticsPeriodChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
                
                {analyticsPeriod === 'day' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        {format(selectedDate, "MMM dd, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
                
                {analyticsPeriod === 'month' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        {format(selectedMonth, "MMMM yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4">
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({length: 12}, (_, i) => {
                          const monthDate = new Date(selectedMonth.getFullYear(), i, 1);
                          const monthName = monthDate.toLocaleString('default', { month: 'short' });
                          const isSelected = selectedMonth.getMonth() === i;
                          
                          return (
                            <Button
                              key={i}
                              variant={isSelected ? 'default' : 'ghost'}
                              className={`h-8 w-full text-xs ${isSelected ? 'font-bold' : ''}`}
                              onClick={() => setSelectedMonth(monthDate)}
                            >
                              {monthName}
                            </Button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            const prevYear = new Date(selectedMonth);
                            prevYear.setFullYear(prevYear.getFullYear() - 1);
                            setSelectedMonth(prevYear);
                          }}
                        >
                          &larr; Prev
                        </Button>
                        <div className="text-sm font-medium">
                          {selectedMonth.getFullYear()}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const nextYear = new Date(selectedMonth);
                            nextYear.setFullYear(nextYear.getFullYear() + 1);
                            setSelectedMonth(nextYear);
                          }}
                        >
                          Next &rarr;
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                
                {analyticsPeriod === 'year' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        {format(selectedYear, "yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <div className="grid grid-cols-4 gap-2 p-4">
                        {Array.from({length: 10}, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <Button
                              key={year}
                              variant={selectedYear.getFullYear() === year ? "default" : "ghost"}
                              onClick={() => setSelectedYear(new Date(year, 0, 1))}
                              className="w-full"
                            >
                              {year}
                            </Button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {analyticsPeriod === 'day' && `Viewing data for ${format(selectedDate, 'MMMM d, yyyy')}`}
                {analyticsPeriod === 'month' && `Viewing data for ${format(selectedMonth, 'MMMM yyyy')}`}
                {analyticsPeriod === 'year' && `Viewing data for ${format(selectedYear, 'yyyy')}`}
              </div>
            </div>
          </div>

          {/* Revenue Trends Chart */}
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Revenue Trends</span>
              </CardTitle>
              <CardDescription>
                {analyticsPeriod === 'day' && `Revenue for ${format(selectedDate, 'MMMM d, yyyy')}`}
                {analyticsPeriod === 'month' && `Monthly revenue for ${format(selectedMonth, 'MMMM yyyy')}`}
                {analyticsPeriod === 'year' && `Annual revenue for ${format(selectedYear, 'yyyy')}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      // Generate data based on selected period
                      if (analyticsPeriod === 'day') {
                        // Generate data points for each hour from 9 AM to 12 AM (midnight)
                        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
                        const dayAppointments = appointments.filter(apt => apt.date === selectedDateStr);
                        
                        // Create data points for each hour
                        return Array.from({length: 16}, (_, i) => {
                          const hour = i + 9; // 9 AM to 12 AM (9-24)
                          
                          // Find appointments for this hour
                          const hourAppointments = dayAppointments.filter(apt => {
                            if (!apt.time) return false;
                            
                            // Extract hour from time string (supports both '9:00 AM' and '09:00' formats)
                            const timeMatch = apt.time.match(/(\d+):/);
                            if (!timeMatch) return false;
                            
                            let aptHour = parseInt(timeMatch[1], 10);
                            
                            // Adjust for PM times (convert 12-hour to 24-hour)
                            if (apt.time.includes('PM') && aptHour < 12) aptHour += 12;
                            if (apt.time.includes('AM') && aptHour === 12) aptHour = 0;
                            
                            return aptHour === hour;
                          });
                          
                          // Calculate total revenue for this hour
                          const revenue = hourAppointments.reduce((sum, apt) => {
                            return sum + (apt.serviceIds?.reduce((serviceSum, serviceId) => {
                              const service = mockServices.find(s => s.id === serviceId);
                              return serviceSum + (service?.price || 0);
                            }, 0) || 0);
                          }, 0);
                          const displayHour = hour > 12 ? hour - 12 : hour;
                          const period = hour >= 12 ? 'PM' : 'AM';
                          const nextHour = hour + 1 > 24 ? 1 : hour + 1;
                          const nextDisplayHour = (nextHour > 12 ? nextHour - 12 : nextHour) || 12;
                          const nextPeriod = nextHour >= 12 ? 'PM' : 'AM';
                          
                          return {
                            date: `${displayHour} ${period}`,
                            revenue,
                            label: `${displayHour} ${period} - ${nextDisplayHour} ${nextPeriod}`,
                            hour: hour
                          };
                        });
                      } else if (analyticsPeriod === 'month') {
                        // Daily data for the selected month
                        const daysInMonth = new Date(
                          selectedMonth.getFullYear(), 
                          selectedMonth.getMonth() + 1, 
                          0
                        ).getDate();
                        
                        return Array.from({length: daysInMonth}, (_, i) => {
                          const day = i + 1;
                          const date = new Date(
                            selectedMonth.getFullYear(), 
                            selectedMonth.getMonth(), 
                            day
                          );
                          
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const dayAppointments = appointments.filter(apt => 
                            apt.date === dateStr
                          );
                          
                          const revenue = dayAppointments.reduce((sum, apt) => {
                            const servicePrices = apt.serviceIds.map(serviceId => 
                              mockServices.find(s => s.id === serviceId)?.price || 0
                            );
                            return sum + servicePrices.reduce((a, b) => a + b, 0);
                          }, 0);
                          
                          return {
                            date: day.toString(),
                            revenue,
                            label: format(date, 'MMM d')
                          };
                        });
                      } else {
                        // Monthly data for the selected year
                        return Array.from({length: 12}, (_, i) => {
                          const monthAppointments = appointments.filter(apt => {
                            const aptDate = new Date(apt.date);
                            return aptDate.getFullYear() === selectedYear.getFullYear() && 
                                   aptDate.getMonth() === i;
                          });
                          
                          const revenue = monthAppointments.reduce((sum, apt) => {
                            const servicePrices = apt.serviceIds.map(serviceId => 
                              mockServices.find(s => s.id === serviceId)?.price || 0
                            );
                            return sum + servicePrices.reduce((a, b) => a + b, 0);
                          }, 0);
                          
                          return {
                            date: new Date(selectedYear.getFullYear(), i, 1).toLocaleString('default', { month: 'short' }),
                            revenue,
                            label: new Date(selectedYear.getFullYear(), i, 1).toLocaleString('default', { month: 'long' })
                          };
                        });
                      }
                    })()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date, index) => {
                        const data = analyticsPeriod === 'day' 
                          ? Array.from({length: 15}, (_, i) => {
                              const hour = i + 9; // 9 AM to 11 PM
                              return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                            })
                          : analyticsPeriod === 'month'
                            ? Array.from(
                                {length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()}, 
                                (_, i) => (i + 1).toString()
                              )
                            : Array.from({length: 12}, (_, i) => 
                                new Date(selectedYear.getFullYear(), i, 1).toLocaleString('default', { month: 'short' })
                              );
                        return data[index] || date;
                      }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tickFormatter={(value) => `₹${value.toLocaleString()}`}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                      labelFormatter={(label, payload) => {
                        if (!payload || !payload[0] || !payload[0].payload) return label;
                        if (analyticsPeriod === 'day') {
                          return `Time: ${payload[0].payload.label}`;
                        } else if (analyticsPeriod === 'month') {
                          return `Date: ${format(
                            new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), parseInt(label)),
                            'MMM d, yyyy'
                          )}`;
                        } else {
                          return `Month: ${payload[0].payload.label} ${selectedYear.getFullYear()}`;
                        }
                      }}
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#818cf8" 
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    >
                      {(() => {
                        const data = analyticsPeriod === 'day' 
                          ? Array(16).fill(0) // 9 AM to 12 AM is 16 hours
                          : analyticsPeriod === 'month'
                            ? Array(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()).fill(0)
                            : Array(12).fill(0);
                            
                        return data.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={index === 0 ? '#4f46e5' : '#818cf8'}
                          />
                        ));
                      })()}
                      <LabelList 
                        dataKey="revenue" 
                        position="top" 
                        formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                        fill="#ffffff"
                        style={{ 
                          fontSize: '12px',
                          textShadow: '0 0 2px rgba(0,0,0,0.8)'
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Grid - 2x2 layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Services - Compact */}
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>Top Services</span>
                </CardTitle>
                <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                  {getPeriodText()}
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {mockServices
                    .map(service => ({
                      ...service,
                      popularity: appointments.filter(apt => {
                        const aptDate = new Date(apt.date);
                        const matchesPeriod = 
                          (analyticsPeriod === 'day' && apt.date === format(selectedDate, 'yyyy-MM-dd')) ||
                          (analyticsPeriod === 'month' && 
                            aptDate.getMonth() === selectedMonth.getMonth() && 
                            aptDate.getFullYear() === selectedMonth.getFullYear()) ||
                          (analyticsPeriod === 'year' && 
                            aptDate.getFullYear() === selectedYear.getFullYear());
                        return apt.serviceIds.includes(service.id) && matchesPeriod;
                      }).length
                    }))
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 5)
                    .map((service) => (
                      <div key={service.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 truncate">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <Scissors className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="truncate">{service.name}</span>
                        </div>
                        <Badge variant="outline" className="h-6 px-2 text-xs bg-primary/10 text-primary">
                          {appointments.filter(apt => 
                            apt.serviceIds.includes(service.id) && 
                            apt.date === format(selectedDate, 'yyyy-MM-dd')
                          ).length}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers - Compact */}
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Top Performers</span>
                </CardTitle>
                <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                  {getPeriodText()}
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {employees
                  .map(employee => {
                    const employeeAppointments = appointments.filter(apt => {
                      if (apt.employeeId !== employee.id) return false;
                      const aptDate = new Date(apt.date);
                      if (analyticsPeriod === 'day') return apt.date === format(selectedDate, 'yyyy-MM-dd');
                      if (analyticsPeriod === 'month') return (
                        aptDate.getMonth() === selectedMonth.getMonth() && 
                        aptDate.getFullYear() === selectedMonth.getFullYear()
                      );
                      return aptDate.getFullYear() === selectedYear.getFullYear();
                    });
                    
                    const employeeRevenue = employeeAppointments.reduce((sum, apt) => {
                      const servicePrices = apt.serviceIds.map(serviceId => 
                        mockServices.find(s => s.id === serviceId)?.price || 0
                      );
                      return sum + servicePrices.reduce((a, b) => a + b, 0);
                    }, 0);
                    
                    return {
                      ...employee,
                      appointmentCount: employeeAppointments.length,
                      revenue: employeeRevenue
                    };
                  })
                  .sort((a, b) => b.appointmentCount - a.appointmentCount)
                  .slice(0, 5)
                  .map((employee, index) => (
                    <div key={employee.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-medium text-secondary">
                          {index + 1}
                        </div>
                        <span className="truncate">{employee.name.split(' ')[0]}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-xs">{formatPrice(employee.revenue)}</div>
                        <div className="text-xs text-muted-foreground">{employee.appointmentCount} appts</div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Service Performance - Compact */}
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Service Performance</CardTitle>
                <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                  {getPeriodText()}
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {mockServices.slice(0, 5).map((service) => {
                  const serviceAppointments = appointments.filter(apt => 
                    apt.serviceIds.includes(service.id)
                  ).length;
                  
                  const serviceRevenue = tallyItems.reduce((sum, item) => {
                    const hasService = item.services.some(s => s.name === service.name);
                    return hasService ? sum + item.totalCost : sum;
                  }, 0);
                  
                  return (
                    <div key={service.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 truncate">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="truncate">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-xs">{formatPrice(serviceRevenue)}</div>
                        <div className="text-xs text-muted-foreground">{serviceAppointments} appts</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Peak Hours Analysis - Compact */}
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
                <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                  {getPeriodText()}
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {Array.from({length: 5}, (_, i) => {
                  const hour = i + 10; // 10 AM to 2 PM as example peak hours
                  const hourAppointments = appointments.filter(apt => {
                    if (!apt.time) return false;
                    const timeMatch = apt.time.match(/(\d+):/);
                    if (!timeMatch) return false;
                    let aptHour = parseInt(timeMatch[1], 10);
                    if (apt.time.includes('PM') && aptHour < 12) aptHour += 12;
                    return aptHour === hour;
                  }).length;
                  
                  return (
                    <div key={hour} className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                      <div className="flex items-center space-x-2 w-3/5">
                        <div className="h-2 bg-primary/20 rounded-full flex-1 overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${Math.min(100, (hourAppointments / 10) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs w-6 text-right">{hourAppointments}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Download Data Tab */}
        <TabsContent value="download" className="space-y-6">
          <DownloadDataTab />
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      {selectedAppointment && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          amount={selectedAppointment.amount}
          customerPhone={selectedAppointment.customerPhone}
          onPaymentComplete={async (method: PaymentMethod, upiTransactionId?: string): Promise<void> => {
            const appointment = appointments.find(a => a.id === selectedAppointment.id);
            if (!appointment) {
              toast.error('Appointment not found');
              throw new Error('Appointment not found');
            }
            
            // Update the appointment status to completed
            await updateAppointment(appointment.id, { 
              status: 'completed' 
            });
            
            // Find customer and employee details
            const customer = customers.find(c => c.id === appointment.customerId);
            const employee = employees.find(e => e.id === appointment.employeeId);
            
            if (!customer || !employee) {
              toast.error('Customer or employee not found');
              throw new Error('Customer or employee not found');
            }
            
            // Create the tally item data
            const tallyItemData = {
              date: appointment.date,
              time: appointment.time,
              customerName: customer.name,
              customerPhone: customer.phone,
              staffName: employee.name,
              services: appointment.serviceIds
                .map(id => ({
                  name: mockServices.find(s => s.id === id)?.name || 'Unknown Service',
                  price: mockServices.find(s => s.id === id)?.price || 0
                }))
                .filter(service => service.name !== 'Unknown Service'),
              totalCost: selectedAppointment.amount,
              paymentMethod: method,
              paymentStatus: 'completed' as const
            };
            
            // Add to tally
            const newTallyItem = addTallyItem(tallyItemData);
            
            // If this is a UPI payment, update with transaction ID
            if (method === 'upi' && upiTransactionId) {
              updatePaymentStatus(newTallyItem.id, 'completed', upiTransactionId);
            }
            
            // Show success message
            toast.success('Payment processed successfully');
            // No return value needed as the type is Promise<void>
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
