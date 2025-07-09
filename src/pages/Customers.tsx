import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ImageModal from "@/components/ImageModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Phone, Calendar, Star, ArrowRight, Filter, User, Users, User2, List, Grid } from "lucide-react";
import { AddCustomerButton } from "@/components/AddCustomerButton";
import { useCustomers } from "@/contexts/CustomersContext";
import type { Customer } from "@/contexts/CustomersContext";
import { format } from "date-fns";
import { useAppointments } from "@/contexts/AppointmentsContext";

// Define Transaction interface
interface Transaction {
  id: string;
  customerId: string;
  date: string;
  items: Array<{ id: string; name: string; price: number }>;
  total: number;
}

// Mock transactions data (temporary until we have a transactions context)
const mockTransactions = [
  {
    id: '1',
    customerId: '1',
    date: '2023-06-15',
    items: [
      { id: '1', name: 'Haircut', price: 500 },
      { id: '2', name: 'Beard Trim', price: 200 }
    ],
    total: 700
  },
  {
    id: '2',
    customerId: '1',
    date: '2023-05-20',
    items: [
      { id: '1', name: 'Hair Color', price: 1500 },
      { id: '3', name: 'Hair Spa', price: 1000 }
    ],
    total: 2500
  },
  {
    id: '3',
    customerId: '2',
    date: '2023-06-10',
    items: [
      { id: '4', name: 'Facial', price: 1200 },
      { id: '5', name: 'Threading', price: 300 }
    ],
    total: 1500
  }
];

type GenderFilter = 'all' | 'male' | 'female';
type SortBy = 'name' | 'visits' | 'spent' | 'lastVisit';

interface ZoomedImage {
  src: string;
  alt: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { setSelectedCustomerId } = useAppointments();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [zoomedImage, setZoomedImage] = useState<ZoomedImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Handle booking appointment for a customer
  const handleBookAppointment = (customerId: string) => {
    // Set the selected customer in the appointments context
    setSelectedCustomerId(customerId);
    // Navigate to the booking page
    navigate('/booking');
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

  const handleImageClick = (e: React.MouseEvent | React.TouchEvent, src: string, alt: string) => {
    e.stopPropagation();
    e.preventDefault();
    setZoomedImage({ src, alt });
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer: Customer) => {
        // Apply search filter
        const matchesSearch = 
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm) ||
          (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Apply gender filter
        const matchesGender = genderFilter === 'all' || customer.gender === genderFilter;
        
        return matchesSearch && matchesGender;
      })
      .sort((a: Customer, b: Customer) => {
        // Apply sorting based on sortBy state
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'visits':
            return (b.visitCount || 0) - (a.visitCount || 0);
          case 'spent':
            return (b.totalSpent || 0) - (a.totalSpent || 0);
          case 'lastVisit':
            return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
          default:
            return 0;
        }
      });
  }, [customers, searchTerm, genderFilter, sortBy]);

  // Format price with Indian Rupee symbol
  const formatPrice = (price: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Format date to a readable format
  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'dd MMM yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getLoyaltyLevel = (visitCount: number = 0) => {
    if (visitCount >= 20) return { level: "VIP", color: "bg-gradient-primary" };
    if (visitCount >= 10) return { level: "Gold", color: "bg-yellow-500" };
    return { level: "Bronze", color: "bg-amber-600" };
  };

  const getRecentTransactions = (customerId: string): Transaction[] => {
    return (mockTransactions as Transaction[])
      .filter(tx => tx.customerId === customerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2); // Show only 2 most recent
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer records, history, and preferences
          </p>
        </div>
        
        <AddCustomerButton variant="salon" />
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Select 
                  value={genderFilter}
                  onValueChange={(value: GenderFilter) => setGenderFilter(value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        All
                      </div>
                    </SelectItem>
                    <SelectItem value="male">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Gents
                      </div>
                    </SelectItem>
                    <SelectItem value="female">
                      <div className="flex items-center">
                        <User2 className="h-4 w-4 mr-2" />
                        Ladies
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex space-x-2">
                {[
                  { key: "name", label: "Name" },
                  { key: "visits", label: "Visits" },
                  { key: "spent", label: "Spent" },
                  { key: "lastVisit", label: "Recent" }
                ].map((option) => (
                  <Button
                    key={option.key}
                    variant={sortBy === option.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(option.key as any)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle and Customer Count */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredCustomers.length}</span> of <span className="font-medium text-foreground">{customers.length}</span> customers
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Customers Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-2'}>
        {filteredCustomers.map((customer) => {
          if (viewMode === 'list') {
            return (
              <Card key={customer.id} className="bg-card/50 dark:bg-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer"
                        onClick={(e) => customer.photo && handleImageClick(e, customer.photo, customer.name)}
                        onTouchEnd={(e) => customer.photo && handleImageClick(e, customer.photo, customer.name)}
                      >
                        {customer.photo ? (
                          <img 
                            src={customer.photo} 
                            alt={customer.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center" style={{ display: customer.photo ? 'none' : 'flex' }}>
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold">{customer.name}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{formatPhoneNumber(customer.phone)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(customer.totalSpent)}</div>
                      <div className="text-sm text-muted-foreground">{customer.visitCount} visits</div>
                      <div className="text-xs text-muted-foreground">Last: {formatDate(customer.lastVisit)}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Preferred Services: </span>
                      <span className="font-medium">{customer.preferredServices.join(', ')}</span>
                    </div>
                    {customer.notes && (
                      <div className="text-sm mt-1">
                        <span className="text-muted-foreground">Notes: </span>
                        <span>{customer.notes}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // Grid view (original implementation)
          const loyalty = getLoyaltyLevel(customer.visitCount);
          const recentTransactions = getRecentTransactions(customer.id);
          
          return (
            <Card key={customer.id} className="bg-card/50 dark:bg-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer"
                      onClick={(e) => customer.photo && handleImageClick(e, customer.photo, customer.name)}
                      onTouchEnd={(e) => customer.photo && handleImageClick(e, customer.photo, customer.name)}
                    >
                      {customer.photo ? (
                        <img 
                          src={customer.photo} 
                          alt={customer.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center" style={{ display: customer.photo ? 'none' : 'flex' }}>
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </CardDescription>
                    </div>
                  </div>
                  
                  <Badge className={`${loyalty.color} text-white border-0`}>
                    {loyalty.level}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="text-lg font-bold text-primary">{customer.visitCount}</div>
                    <div className="text-xs text-muted-foreground">Visits</div>
                  </div>
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="text-lg font-bold text-primary">
                      ₹{customer.totalSpent.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-muted-foreground">Spent</div>
                  </div>
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="text-lg font-bold text-primary">
                      {Math.floor((Date.now() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-xs text-muted-foreground">Days ago</div>
                  </div>
                </div>

                {/* Preferred Services */}
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center">
                    <Star className="h-4 w-4 mr-1 text-primary" />
                    Preferred Services
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {customer.preferredServices.map((service) => (
                      <Badge key={service} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                {recentTransactions.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-primary" />
                      Recent Activity
                    </div>
                    <div className="space-y-2">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center text-xs p-2 bg-accent/30 rounded">
                          <div>
                            <div className="font-medium">{transaction.items[0].name}</div>
                            <div className="text-muted-foreground">{transaction.date}</div>
                          </div>
                          <div className="font-medium text-primary">
                            ₹{transaction.total.toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {customer.notes && (
                  <div>
                    <div className="text-sm font-medium mb-1">Notes</div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {customer.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2 border-t border-border/50">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <User className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                  <Button 
                    size="sm" 
                    variant="salon" 
                    className="flex-1"
                    onClick={() => handleBookAppointment(customer.id)}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No customers found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
            <Button onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border/50 shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{customers.length}</div>
            <div className="text-sm text-muted-foreground">Total Customers</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border/50 shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {customers.filter(c => c.visitCount >= 10).length}
            </div>
            <div className="text-sm text-muted-foreground">Loyal Customers</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border/50 shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {customers.length > 0 
                ? `₹${Math.round(customers.reduce((acc, c) => acc + c.totalSpent, 0) / customers.length)}`
                : '0'}
            </div>
            <div className="text-sm text-muted-foreground">Avg. Lifetime Value</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border/50 shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {customers.length > 0 
                ? Math.round(customers.reduce((acc, c) => acc + c.visitCount, 0) / customers.length)
                : '0'}
            </div>
            <div className="text-sm text-muted-foreground">Avg. Visit Count</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Image Modal */}
      {zoomedImage && (
        <ImageModal 
          src={zoomedImage.src} 
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}
    </div>
  );
}