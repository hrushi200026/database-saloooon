import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Star, User, Search, Plus } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { mockEmployees, mockServices } from "@/data/mockData";
import { StaffAndTimeSelector } from "@/components/StaffAndTimeSelector";
import { useAppointments } from "@/contexts/AppointmentsContext";
import type { Appointment } from "@/contexts/AppointmentsContext";
import { useCustomers } from "@/contexts/CustomersContext";
import { AddCustomerButton } from "@/components/AddCustomerButton";

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 AM", "01:00 PM", "02:00 PM",
  "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM",
  "09:00 PM", "10:00 PM", "11:00 PM"
];

export default function Booking() {
  const navigate = useNavigate();
  const { addAppointment, selectedCustomerId, setSelectedCustomerId } = useAppointments();
  const { customers } = useCustomers();
  
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState<any>(
    selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) || null : null
  );
  const [customerSearch, setCustomerSearch] = useState("");
  
  // Update selectedCustomer when selectedCustomerId changes
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setSelectedCustomer(customer);
      }
    }
  }, [selectedCustomerId, customers]);
  
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const steps = [
    { number: 1, title: "Select Services" },
    { number: 2, title: "Staff & Time" },
    { number: 3, title: "Confirm" }
  ];

  const selectedEmployeeData = selectedEmployee 
    ? mockEmployees.find(e => e.id === selectedEmployee)
    : null;

  const selectedServicesData = mockServices.filter(s => selectedServices.includes(s.id));
  const totalDuration = selectedServicesData.reduce((acc, service) => acc + service.duration, 0);
  const totalPrice = selectedServicesData.reduce((acc, service) => acc + service.price, 0);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleBooking = async () => {
    if (!selectedEmployeeData || !selectedCustomer || !selectedTime || selectedServices.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsBooking(true);
    
    try {
      const newAppointment = {
        id: uuidv4(),
        customerId: selectedCustomer.id,
        employeeId: selectedEmployeeData.id,
        serviceIds: selectedServices,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'scheduled' as const,
        total: totalPrice,
        notes: ''
      };

      // Add the new appointment to the context
      addAppointment(newAppointment);
      
      // Show success message
      const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(price);
      };
      
      alert(`Booking confirmed!\n\n` +
        `Customer: ${selectedCustomer.name}\n` +
        `Employee: ${selectedEmployeeData.name}\n` +
        `Services: ${selectedServicesData.map(s => s.name).join(', ')}\n` +
        `Date: ${format(selectedDate, 'PPP')}\n` +
        `Time: ${selectedTime}\n` +
        `Total: ${formatPrice(totalPrice)}`
      );
      
          // Reset form and context, then redirect to dashboard
      setSelectedCustomer(null);
      setSelectedCustomerId(null);
      setSelectedServices([]);
      setSelectedEmployee(null);
      setSelectedTime(null);
      setStep(1);
      navigate('/');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{5})/, '+$1 $2 $3');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Book Appointment</h1>
        <p className="text-muted-foreground mt-2">
          Choose your preferred service provider and book your appointment
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((stepItem) => (
          <div key={stepItem.number} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepItem.number 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {stepItem.number}
            </div>
            <span className={`ml-2 text-sm ${
              step >= stepItem.number ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {stepItem.title}
            </span>
            {stepItem.number < 4 && (
              <div className={`w-8 h-0.5 mx-4 ${
                step > stepItem.number ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Services */}
      {step === 1 && (
        <div className="space-y-6">
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Services</CardTitle>
              <CardDescription className="text-xs">
                Choose the services you'd like to book
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mockServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceToggle(service.id)}
                    className={`p-3 rounded-md border cursor-pointer transition-all text-sm ${
                      selectedServices.includes(service.id)
                        ? 'border-primary bg-primary/5 shadow-soft'
                        : 'border-border hover:border-primary/50 hover:shadow-soft'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {service.description}
                        </p>
                        <div className="flex items-center space-x-3 mt-1.5">
                          <Badge variant="secondary" className="text-xs h-5">
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            {service.duration}min
                          </Badge>
                          <span className="font-medium text-primary text-sm">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedServices.length > 0 && (
                <div className="mt-4 p-3 bg-accent/30 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">
                        {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {totalDuration} minutes total
                      </div>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {formatPrice(totalPrice)}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => setStep(2)}
                  disabled={selectedServices.length === 0}
                  className="min-w-32"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Combined Staff & Time Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle>Select Staff & Time</CardTitle>
              <CardDescription>
                Choose your preferred staff member and time slot for the appointment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaffAndTimeSelector
                selectedEmployee={selectedEmployee}
                selectedTime={selectedTime}
                onEmployeeSelect={setSelectedEmployee}
                onTimeSelect={setSelectedTime}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            </CardContent>
          </Card>
        </div>
      )}



      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle>Confirm Your Appointment</CardTitle>
              <CardDescription>
                Please review your booking details before confirming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Selection */}
              <div className="space-y-2">
                <h3 className="font-semibold">Customer</h3>
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  {selectedCustomer ? (
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage 
                          src={selectedCustomer.photo} 
                          alt={selectedCustomer.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/default-avatar.png';
                          }}
                        />
                        <AvatarFallback>{selectedCustomer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedCustomer.name}</p>
                        <p className="text-sm text-muted-foreground">{formatPhoneNumber(selectedCustomer.phone.replace(/\D/g,''))}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">No customer selected</p>
                    </div>
                  )}
                  <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <User className="h-4 w-4 mr-2" />
                        {selectedCustomer ? 'Change Customer' : 'Select Customer'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Select Customer</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search customers..."
                            className="pl-9"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                          />
                        </div>
                        <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto">
                          <div className="divide-y">
                            {filteredCustomers.map((customer) => (
                                <div 
                                  key={customer.id}
                                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 ${selectedCustomer?.id === customer.id ? 'bg-accent' : ''}`}
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setSelectedCustomerId(customer.id);
                                    setIsCustomerDialogOpen(false);
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <Avatar>
                                      <AvatarImage 
                                        src={customer.photo} 
                                        alt={customer.name}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = '/default-avatar.png';
                                        }}
                                      />
                                      <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{customer.name}</p>
                                      <p className="text-sm text-muted-foreground">{formatPhoneNumber(customer.phone.replace(/\D/g,''))}</p>
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {customer.visitCount} visits
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                        <AddCustomerButton 
                          variant="outline" 
                          className="w-full"
                          onCustomerAdded={() => {
                            // Refresh the customers list after adding a new one
                            setCustomerSearch('');
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Customer
                        </AddCustomerButton>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Services Summary */}
              <div>
                <h3 className="font-semibold mb-3">Services</h3>
                <div className="space-y-2">
                  {selectedServicesData.map((service) => (
                    <div key={service.id} className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">{service.duration} minutes</div>
                      </div>
                      <div className="font-semibold">{formatPrice(service.price)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff & Time Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Staff Member</h3>
                  <div className="flex items-center space-x-3 p-3 bg-accent/50 rounded-lg">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedEmployeeData?.photo} alt={selectedEmployeeData?.name} />
                      <AvatarFallback>
                        {selectedEmployeeData?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedEmployeeData?.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedEmployeeData?.role}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Appointment Time</h3>
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">Today</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Duration: {totalDuration} minutes
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={handleBooking} 
                  variant="salon" 
                  className="min-w-32"
                  disabled={isBooking}
                >
                  {isBooking ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}