import { useState, FormEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomers } from "@/contexts/CustomersContext";
import { Plus, UserPlus, Upload, User, X } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddCustomerButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "salon" | "destructive" | "elegant";
  className?: string;
  onCustomerAdded?: () => void;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  preferredServices: string;
  notes: string;
  photo: string;
}

export function AddCustomerButton({ 
  variant = "default", 
  className = "", 
  onCustomerAdded, 
  children 
}: React.PropsWithChildren<AddCustomerButtonProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    gender: "male",
    preferredServices: "",
    notes: "",
    photo: ""
  });
  
  const { addCustomer } = useCustomers();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          photo: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      gender: "male",
      preferredServices: "",
      notes: "",
      photo: ""
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Create customer data without the id (let the context handle it)
      const newCustomer = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        gender: formData.gender,
        preferredServices: formData.preferredServices.split(',').map(s => s.trim()).filter(Boolean),
        notes: formData.notes.trim(),
        photo: formData.photo || ""
      };
      
      await addCustomer(newCustomer);
      
      toast.success("Customer added successfully!");
      setIsOpen(false);
      resetForm();
      
      if (onCustomerAdded) {
        onCustomerAdded();
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className} onClick={() => setIsOpen(true)}>
          {children || (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Photo</Label>
              <div className="flex items-center space-x-4">
                <div className="relative h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden">
                  {formData.photo ? (
                    <img 
                      src={formData.photo} 
                      alt="Customer preview" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <User className="h-6 w-6 mx-auto text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Preview</span>
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="customerPhoto"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1"
                    onClick={() => document.getElementById('customerPhoto')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.photo ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {formData.photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 ml-2 text-destructive hover:text-destructive"
                      onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name"
                name="name"
                placeholder="Customer name"
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input 
                id="phone"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                required
                type="tel"
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value: 'male' | 'female') => handleSelectChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <Label htmlFor="preferredServices">Preferred Services</Label>
            <Input 
              id="preferredServices"
              name="preferredServices"
              placeholder="e.g., Haircut, Facial, Massage"
              value={formData.preferredServices}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground mt-1">Separate multiple services with commas</p>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.phone.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
