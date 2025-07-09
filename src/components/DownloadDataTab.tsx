import React, { useState, useMemo } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar as CalendarIcon, Clock, User, DollarSign, Users, Scissors, CreditCard, TrendingUp, CheckCircle2, XCircle, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useTally } from '@/contexts/TallyContext';
import { useStaff } from '@/contexts/StaffContext';
import { mockServices, mockCustomers } from '@/data/mockData';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF type definitions
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

type JsPDFWithPlugin = jsPDF & {
  lastAutoTable?: { finalY: number };
  autoTable: (options: any) => JsPDFWithPlugin;
  getNumberOfPages: () => number;
  setPage: (pageNumber: number) => void;
  setFontSize: (size: number) => void;
  setTextColor: (color: number) => void;
  text: (text: string, x: number, y: number, options?: { align: string }) => void;
  save: (filename: string) => void;
  internal: {
    pageSize: {
      height: number;
      width: number;
    };
  };
};

export function DownloadDataTab() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { appointments } = useAppointments();
  const { tallyItems } = useTally();
  const { employees } = useStaff();
  const services = mockServices;
  
  // Time slots for the schedule - matching the Schedule page format
  const timeSlots = [
    { display: "9-10 AM", start: "9:00 AM" },
    { display: "10-11 AM", start: "10:00 AM" },
    { display: "11-12 PM", start: "11:00 AM" },
    { display: "12-1 PM", start: "12:00 PM" },
    { display: "1-2 PM", start: "1:00 PM" },
    { display: "2-3 PM", start: "2:00 PM" },
    { display: "3-4 PM", start: "3:00 PM" },
    { display: "4-5 PM", start: "4:00 PM" },
    { display: "5-6 PM", start: "5:00 PM" },
    { display: "6-7 PM", start: "6:00 PM" },
    { display: "7-8 PM", start: "7:00 PM" },
    { display: "8-9 PM", start: "8:00 PM" },
    { display: "9-10 PM", start: "9:00 PM" },
    { display: "10-11 PM", start: "10:00 PM" },
    { display: "11-12 AM", start: "11:00 PM" }
  ];
  
  // Helper to format time consistently (12-hour format with AM/PM)
  const formatTime = (time: string) => {
    // If already in 12-hour format, return as is
    if (time.includes('AM') || time.includes('PM')) {
      return time;
    }
    
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Helper function to get appointment for a specific staff and time slot
  const getAppointmentForSlot = (staffId: string, timeSlot: string) => {
    if (!selectedDate) return null;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Format the time slot to match the format used in appointments
    const formattedTimeSlot = formatTime(timeSlot);
    
    // Debug: Log the values being compared
    console.log('Comparing:', {
      staffId,
      timeSlot,
      formattedTimeSlot,
      appointments: appointments.filter(apt => apt.employeeId === staffId && apt.date === dateStr)
    });
    
    // Find the appointment that matches the staff, date, and time
    const foundAppointment = appointments.find(apt => {
      if (apt.employeeId !== staffId || apt.date !== dateStr) return false;
      
      // Format the appointment time to match the timeSlot format
      const formattedAptTime = formatTime(apt.time);
      
      // Compare the formatted times
      return formattedAptTime === formattedTimeSlot;
    });
    
    console.log('Found appointment:', foundAppointment);
    return foundAppointment;
  };
  
  // Helper function to get status color for an appointment
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'no-show': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };
  
  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get all data for the selected date
  const filteredData = useMemo(() => {
    if (!selectedDate) return { 
      appointments: [], 
      transactions: [],
      staff: [],
      services: [],
      stats: null,
      analytics: null,
      tallyRecords: [],
      dailySchedule: []
    };
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // 1. Dashboard Data
    // Filter appointments for the selected date
    const filteredAppointments = appointments.filter(
      appt => {
        const matches = appt.date === dateStr;
        console.log('Appointment:', {
          id: appt.id,
          date: appt.date,
          selectedDate: dateStr,
          matches,
          time: appt.time,
          customer: (appt as any).customerName || appt.customerId
        });
        return matches;
      }
    );
    
    console.log('Filtered Appointments:', filteredAppointments);
    
    // Filter transactions for the selected date
    const filteredTransactions = tallyItems.filter(
      item => item.date.startsWith(dateStr)
    );
    
    // 2. Staff and Services Data
    const workingStaff = employees.filter(emp => emp.available);
    
    // Get services booked on the selected date
    const bookedServices = filteredAppointments.flatMap(appt => 
      appt.serviceIds.map(id => ({
        id,
        name: mockServices.find(s => s.id === id)?.name || 'Unknown Service',
        price: mockServices.find(s => s.id === id)?.price || 0,
        duration: mockServices.find(s => s.id === id)?.duration || 0
      }))
    );
    
    // 3. Calculate Dashboard Stats
    const completedTransactions = filteredTransactions.filter(tx => tx.paymentStatus === 'completed');
    const totalRevenue = completedTransactions.reduce((sum, tx) => sum + tx.totalCost, 0);
    const completedAppointments = filteredAppointments.filter(appt => appt.status === 'completed').length;
    const cancelledAppointments = filteredAppointments.filter(appt => appt.status === 'cancelled').length;
    
    // 4. Analytics Data
    const serviceRevenue: Record<string, number> = {};
    const paymentMethods: Record<string, number> = {};
    const staffPerformance: Record<string, { count: number; revenue: number }> = {};
    
    completedTransactions.forEach(tx => {
      // Calculate service-wise revenue
      tx.services.forEach(service => {
        serviceRevenue[service.name] = (serviceRevenue[service.name] || 0) + service.price;
      });
      
      // Count payment methods
      paymentMethods[tx.paymentMethod] = (paymentMethods[tx.paymentMethod] || 0) + 1;
      
      // Track staff performance
      if (!staffPerformance[tx.staffName]) {
        staffPerformance[tx.staffName] = { count: 0, revenue: 0 };
      }
      staffPerformance[tx.staffName].count += 1;
      staffPerformance[tx.staffName].revenue += tx.totalCost;
    });
    
    // 5. Tally Records
    const tallyRecords = filteredTransactions.map(tx => ({
      id: tx.id,
      time: tx.time,
      customerName: tx.customerName,
      staffName: tx.staffName,
      services: tx.services.map(s => s.name).join(', '),
      amount: tx.totalCost,
      paymentMethod: tx.paymentMethod,
      status: tx.paymentStatus
    }));
    
    // 6. Daily Schedule
    const timeSlots = [];
    const startHour = 9; // 9 AM
    const endHour = 21;  // 9 PM
    
    // Get today's date in the same format as the appointments
    const today = format(selectedDate, 'yyyy-MM-dd');
    
    // Filter today's appointments and sort them by status and time
    const todaysAppointments = appointments
      .filter(appt => appt.date === today)
      .sort((a, b) => {
        // Sort by status (cancelled last, then completed, then by time)
        if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
        if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return a.time.localeCompare(b.time);
      });
    
    // Helper function to format time in 12-hour format with AM/PM
    const formatTimeRange = (hour: number) => {
      const startHour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
      const endHour12 = (hour + 1) % 12 || 12; // For the end of the time slot
      const period = hour < 12 ? 'AM' : 'PM';
      const nextPeriod = (hour + 1) < 12 ? 'AM' : 'PM';
      return `${startHour12} ${period} - ${endHour12} ${nextPeriod}`;
    };

    // Group appointments by hour
    const appointmentsByHour: Record<string, {timeRange: string, appointments: typeof todaysAppointments}> = {};
    
    // Initialize time slots with empty arrays
    for (let hour = startHour; hour < endHour; hour++) {
      const timeKey = `${hour.toString().padStart(2, '0')}:00`;
      appointmentsByHour[timeKey] = {
        timeRange: formatTimeRange(hour),
        appointments: []
      };
    }
    
    // Group appointments by their hour
    todaysAppointments.forEach(appt => {
      if (!appt.time) return;
      
      const hour = appt.time.split(':')[0];
      const timeKey = `${hour.padStart(2, '0')}:00`;
      
      if (appointmentsByHour[timeKey] !== undefined) {
        appointmentsByHour[timeKey].appointments.push(appt);
      }
    });
    
    // Create time slots with appointments
    Object.entries(appointmentsByHour).forEach(([timeKey, {timeRange, appointments: slotApps}]) => {
      const slotAppointments = slotApps.map(appt => {
        // Find customer details
        const customer = mockCustomers.find(c => c.id === appt.customerId);
        const customerName = customer?.name || `Customer ${appt.customerId?.substring(0, 4) || 'N/A'}`;
        
        // Get service names
        const serviceNames = appt.serviceIds
          .map(id => mockServices.find(s => s.id === id)?.name || 'Unknown Service')
          .join(', ');
        
        // Get staff name
        const staff = employees.find(e => e.id === appt.employeeId);
        const staffName = staff?.name || 'Staff Unassigned';
        
        return {
          id: appt.id,
          customer: customerName,
          services: serviceNames,
          staff: staffName,
          status: appt.status || 'scheduled'
        };
      });
      
      timeSlots.push({
        time: timeRange, // This will show like '9 AM - 10 AM'
        appointments: slotAppointments,
        availableStaff: workingStaff.length - slotAppointments.length
      });
    });
    
    return { 
      appointments: filteredAppointments,
      transactions: filteredTransactions,
      staff: workingStaff,
      services: [...new Map(bookedServices.map(item => [item.id, item])).values()],
      stats: {
        // Dashboard Overview
        totalAppointments: filteredAppointments.length,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        totalTransactions: filteredTransactions.length,
        staffCount: workingStaff.length,
        uniqueServices: [...new Set(bookedServices.map(s => s.id))].length,
        
        // Additional Metrics
        averageTransactionValue: completedTransactions.length > 0 
          ? totalRevenue / completedTransactions.length 
          : 0,
        conversionRate: filteredAppointments.length > 0
          ? (completedAppointments / filteredAppointments.length) * 100
          : 0
      },
      
      // Analytics Data
      analytics: {
        serviceRevenue: Object.entries(serviceRevenue)
          .map(([name, revenue]) => ({ name, revenue }))
          .sort((a, b) => b.revenue - a.revenue),
        paymentMethods: Object.entries(paymentMethods)
          .map(([method, count]) => ({ method, count }))
          .sort((a, b) => b.count - a.count),
        staffPerformance: Object.entries(staffPerformance)
          .map(([name, { count, revenue }]) => ({
            name,
            appointments: count,
            revenue,
            averageRevenue: revenue / count
          }))
          .sort((a, b) => b.revenue - a.revenue)
      },
      
      // Tally Records
      tallyRecords,
      
      // Daily Schedule
      dailySchedule: timeSlots
    };
  }, [selectedDate, appointments, tallyItems, employees]);

  const exportServiceRevenueToCSV = () => {
    if (!filteredData.analytics?.serviceRevenue?.length) return;
    
    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    const headers = ['Service Name', 'Revenue (₹)', 'Percentage of Total'];
    const totalRevenue = filteredData.analytics.serviceRevenue.reduce((sum, svc) => sum + svc.revenue, 0);
    
    const csvContent = [
      headers.join(','),
      ...filteredData.analytics.serviceRevenue.map(svc => [
        `"${svc.name}"`,
        svc.revenue.toFixed(2),
        ((svc.revenue / totalRevenue) * 100).toFixed(2) + '%'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `service-revenue-${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    try {
      if (!selectedDate || !filteredData.stats || !filteredData.analytics) {
        console.error('No data available to generate PDF');
        return;
      }
      
      const dateStr = format(selectedDate, 'dd MMMM yyyy');
      const { 
        stats, 
        appointments, 
        transactions, 
        staff, 
        services, 
        analytics,
        tallyRecords,
        dailySchedule 
      } = filteredData;
      
      // Initialize PDF
      const doc = new jsPDF() as JsPDFWithPlugin;
      let yPos = 20;
    
    // 1. Cover Page
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('Salon Management Report', 105, 50, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(dateStr, 105, 70, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(150);
    doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy hh:mm a')}`, 105, 80, { align: 'center' });
    
    doc.addPage();
    yPos = 20;
    
    // 2. Executive Summary
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 14, yPos);
    yPos += 10;
    
    const summaryData = [
      ['Total Revenue', `₹${stats.totalRevenue.toFixed(2)}`],
      ['Completed Appointments', stats.completedAppointments],
      ['Total Transactions', stats.totalTransactions],
      ['Conversion Rate', `${stats.conversionRate.toFixed(1)}%`],
      ['Average Transaction Value', `₹${stats.averageTransactionValue.toFixed(2)}`],
      ['Active Staff', stats.staffCount],
      ['Unique Services Booked', stats.uniqueServices]
    ];
    
    doc.autoTable({
      startY: yPos + 5,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { 
        fontSize: 10, 
        cellPadding: 5, 
        overflow: 'linebreak',
        textColor: [0, 0, 0]
      },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { cellWidth: 70 }
      }
    });
    
    // 3. Daily Schedule
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.text('Daily Schedule', 14, yPos);
    yPos += 10;
    
    dailySchedule.forEach(slot => {
      if (slot.appointments.length > 0) {
        const slotData = slot.appointments.map(apt => [
          apt.time,
          apt.customer,
          apt.services,
          apt.staff,
          apt.status
        ]);
        
        doc.setFontSize(10);
        doc.setTextColor(59, 130, 246);
        doc.text(`Time: ${slot.time}`, 14, yPos);
        yPos += 5;
        
        doc.autoTable({
          startY: yPos,
          head: [['Time', 'Customer', 'Services', 'Staff', 'Status']],
          body: slotData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { 
            fontSize: 7, 
            cellPadding: 2, 
            overflow: 'linebreak' 
          },
          margin: { left: 14 }
        });
        
        yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;
        
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
      }
    });
    
    // 4. Tally Records
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.text('Tally Records', 14, yPos);
    yPos += 10;
    
    if (tallyRecords.length > 0) {
      const tallyData = tallyRecords.map(tx => [
        tx.time,
        tx.customerName,
        tx.staffName,
        tx.services,
        `₹${tx.amount}`,
        tx.paymentMethod,
        tx.status
      ]);
      
      doc.autoTable({
        startY: yPos,
        head: [['Time', 'Customer', 'Staff', 'Services', 'Amount', 'Method', 'Status']],
        body: tallyData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { 
          fontSize: 7, 
          cellPadding: 2, 
          overflow: 'linebreak' 
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 40 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        }
      });
    } else {
      doc.setFontSize(10);
      doc.text('No tally records for this date', 14, yPos + 5);
    }
    
    // 5. Analytics
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.text('Analytics', 14, yPos);
    yPos += 10;
    
    // Service Revenue
    doc.setFontSize(14);
    doc.text('Service Revenue', 14, yPos);
    yPos += 10;
    
    if (analytics.serviceRevenue.length > 0) {
      const serviceData = analytics.serviceRevenue.map((svc, index) => [
        svc.name,
        `₹${svc.revenue.toFixed(2)}`,
        `${((svc.revenue / stats.totalRevenue) * 100).toFixed(1)}%`
      ]);
      
      doc.autoTable({
        startY: yPos,
        head: [['Service', 'Revenue', 'Share']],
        body: serviceData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { 
          fontSize: 9, 
          cellPadding: 3, 
          overflow: 'linebreak' 
        }
      });
      yPos = (doc as any).lastAutoTable?.finalY + 15;
    }
    
    // Payment Methods
    doc.setFontSize(14);
    doc.text('Payment Methods', 14, yPos);
    yPos += 10;
    
    if (analytics.paymentMethods.length > 0) {
      const paymentData = analytics.paymentMethods.map(pm => [
        pm.method,
        pm.count,
        `${((pm.count / stats.totalTransactions) * 100).toFixed(1)}%`
      ]);
      
      doc.autoTable({
        startY: yPos,
        head: [['Method', 'Count', 'Percentage']],
        body: paymentData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { 
          fontSize: 9, 
          cellPadding: 3, 
          overflow: 'linebreak' 
        }
      });
      yPos = (doc as any).lastAutoTable?.finalY + 15;
    }
    
    // Staff Performance
    doc.setFontSize(14);
    doc.text('Staff Performance', 14, yPos);
    yPos += 10;
    
    if (analytics.staffPerformance.length > 0) {
      const staffData = analytics.staffPerformance.map(staff => [
        staff.name,
        staff.appointments,
        `₹${staff.revenue.toFixed(2)}`,
        `₹${staff.averageRevenue.toFixed(2)}`
      ]);
      
      doc.autoTable({
        startY: yPos,
        head: [['Staff', 'Appointments', 'Total Revenue', 'Avg/Appt']],
        body: staffData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { 
          fontSize: 8, 
          cellPadding: 2, 
          overflow: 'linebreak' 
        }
      });
    }
    
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount} • Generated on ${format(new Date(), 'dd MMM yyyy hh:mm a')}`, 
          105, 
          doc.internal.pageSize.height - 10,
          { align: 'center' as const }
        );
      }
      
      // Save the PDF with a timestamp in the filename
      const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
      doc.save(`salon-report-${timestamp}.pdf`);
      
      console.log('PDF generated and downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Download Data</h3>
          <p className="text-sm text-muted-foreground">
            Select a date to generate a detailed report
          </p>
        </div>
        
        <div className="w-full space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="default"
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30 transition-all duration-200"
              onClick={generatePDF}
              disabled={!filteredData.analytics?.serviceRevenue?.length}
            >
              <Download className="mr-2 h-5 w-5" />
              <span className="font-semibold">Export Full Report</span>
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">PDF</span>
            </Button>
          </div>
        </div>
      </div>
      
      {selectedDate && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="rounded-lg border p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Executive Summary</h3>
              <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{filteredData.stats?.totalRevenue.toFixed(2) || '0.00'}</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-300">Completed Appointments</p>
                    <p className="text-2xl font-bold">{filteredData.stats?.completedAppointments || 0}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Total Transactions</p>
                    <p className="text-2xl font-bold">{filteredData.stats?.totalTransactions || 0}</p>
                  </div>
                  <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-300">Conversion Rate</p>
                    <p className="text-2xl font-bold">{filteredData.stats?.conversionRate.toFixed(1) || '0.0'}%</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Tally Records */}
          <div className="rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Tally Records</h3>
              <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Time</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Staff</th>
                    <th className="text-left p-3">Services</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-left p-3">Method</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.tallyRecords?.length > 0 ? (
                    filteredData.tallyRecords.map((record, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-3">{record.time}</td>
                        <td className="p-3">{record.customerName}</td>
                        <td className="p-3">{record.staffName}</td>
                        <td className="p-3 max-w-xs truncate">{record.services}</td>
                        <td className="p-3 text-right font-medium">₹{record.amount}</td>
                        <td className="p-3">{record.paymentMethod}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">
                        No transactions found for this date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Service Revenue */}
            <div className="rounded-lg border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Service Revenue</h3>
                <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                  {format(selectedDate, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="space-y-2">
                {filteredData.analytics?.serviceRevenue?.length > 0 ? (
                  filteredData.analytics.serviceRevenue.map((service, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{service.name}</span>
                        <span className="font-medium">₹{service.revenue.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{
                            width: `${(service.revenue / filteredData.stats?.totalRevenue) * 100}%`,
                            maxWidth: '100%'
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No service revenue data available</p>
                )}
              </div>
            </div>
            
            {/* Staff Performance */}
            <div className="rounded-lg border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Staff Performance</h3>
                <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                  {format(selectedDate, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="space-y-4">
                {filteredData.analytics?.staffPerformance?.length > 0 ? (
                  filteredData.analytics.staffPerformance.map((staff, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{staff.name}</span>
                        <span className="font-medium">₹{staff.revenue.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>{staff.appointments} appointment{staff.appointments !== 1 ? 's' : ''}</span>
                        <span>Avg: ₹{staff.averageRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No staff performance data available</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Payment Methods</h3>
              <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredData.analytics?.paymentMethods?.length > 0 ? (
                filteredData.analytics.paymentMethods.map((method, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <p className="font-medium">{method.method}</p>
                    <p className="text-2xl font-bold">{method.count}</p>
                    <p className="text-sm text-muted-foreground">
                      {((method.count / filteredData.stats?.totalTransactions) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No payment method data available</p>
              )}
            </div>
          </div>
          
          {/* Daily Schedule */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Daily Schedule</h3>
              <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
            </div>
            <Card className="bg-card/50 dark:bg-card border-border/50 shadow-card overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <span>Daily Schedule</span>
                  </CardTitle>
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <CardDescription>
                  View and manage appointments for each staff member
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="h-14 border-b border-border/50 bg-muted/30 dark:bg-muted/50 flex items-center px-4">
                      <span className="font-medium text-foreground">Staff</span>
                    </div>

                    {/* Staff Rows - Only show available staff */}
                    {employees
                      .filter(employee => employee.available) // Only show available staff
                      .map((employee, index, array) => (
                        <React.Fragment key={employee.id}>
                          {index > 0 && (
                            <div className="h-0.5 bg-foreground/10 dark:bg-foreground/20 my-1.5"></div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] border-b border-border/50 hover:bg-accent/20 transition-colors">
                            {/* Staff Info */}
                            <div className="p-4 flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={employee.photo} alt={employee.name} />
                                <AvatarFallback>
                                  {employee.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-xs text-muted-foreground">{employee.role}</div>
                                <Badge 
                                  variant={employee.available ? "default" : "secondary"} 
                                  className="text-xs mt-1"
                                >
                                  {employee.available ? 'Available' : 'Busy'}
                                </Badge>
                              </div>
                            </div>

                            {/* Time Slots */}
                            <div className="grid grid-cols-8 lg:grid-cols-15 min-h-[80px]">
                              {timeSlots.map((slot, slotIndex) => {
                                const appointment = getAppointmentForSlot(employee.id, slot.start);
                                const slotKey = `slot-${employee.id}-${slot.start.replace(/[\s:]/g, '')}-${slotIndex}`;
                                
                                return (
                                  <div key={slotKey} className="border-l border-border/50 p-1 relative group">
                                    {appointment ? (
                                      <div className={`p-2 rounded text-xs text-white ${getStatusColor(appointment.status)} h-full flex flex-col justify-between cursor-pointer hover:shadow-soft transition-all`}>
                                        <div>
                                          <div className="font-medium text-xs opacity-90 mb-1">
                                            {slot.display}
                                          </div>
                                          <div className="font-medium truncate">
                                            {mockCustomers.find(c => c.id === appointment.customerId)?.name || 'Unknown Customer'}
                                          </div>
                                          <div className="text-xs opacity-90 truncate">
                                            {appointment.serviceIds.map(id => 
                                              services.find(s => s.id === id)?.name
                                            ).filter(Boolean).join(', ')}
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                          <span className="text-xs">{formatPrice(appointment.total)}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        className={`h-full w-full rounded cursor-pointer transition-colors flex flex-col items-center justify-center p-1 ${
                                          employee.available 
                                            ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800/50' 
                                            : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/50'
                                        }`}
                                      >
                                        <div className="flex flex-col items-center justify-center h-full">
                                          <span className={`text-[8px] font-medium mb-0.5 ${
                                            employee.available
                                              ? 'text-green-700 dark:text-green-300'
                                              : 'text-red-700 dark:text-red-300'
                                          }`}>
                                            {slot.display}
                                          </span>
                                          <div className="flex items-center">
                                            <span className={`text-[9px] ${
                                              employee.available 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                              {employee.available ? 'Available' : 'Booked'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    {employees.filter(employee => employee.available).length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        No available staff members
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
