import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Clock } from "lucide-react";
import { format } from 'date-fns';
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useStaff } from "@/contexts/StaffContext";

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

interface StaffAndTimeSelectorProps {
  selectedEmployee: string | null;
  selectedTime: string | null;
  onEmployeeSelect: (employeeId: string) => void;
  onTimeSelect: (time: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StaffAndTimeSelector({
  selectedEmployee,
  selectedTime,
  onEmployeeSelect,
  onTimeSelect,
  onBack,
  onNext
}: StaffAndTimeSelectorProps) {
  const { appointments } = useAppointments();
  const { employees } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<string | null>(selectedEmployee);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(selectedTime);
  
  // Filter to only show available staff
  const availableStaff = employees.filter(emp => emp.available);

  // Format time to match the format used in the timeSlots
  const formatTime = (time: string) => {
    if (time.includes('AM') || time.includes('PM')) {
      return time; // Already in 12-hour format
    }
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Check if a time slot is booked
  const isSlotBooked = (employeeId: string, timeSlot: string) => {
    return appointments.some(apt => {
      const aptTime = formatTime(apt.time);
      return (
        apt.employeeId === employeeId && 
        aptTime === timeSlot &&
        apt.status !== 'cancelled' &&
        // Only consider appointments for today
        apt.date === format(new Date(), 'yyyy-MM-dd')
      );
    });
  };

  const handleStaffSelect = (employeeId: string) => {
    setSelectedStaff(employeeId);
    onEmployeeSelect(employeeId);
    // Reset selected time when changing staff
    setSelectedSlot(null);
    onTimeSelect('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedSlot(time);
    onTimeSelect(time);
  };

  const handleNext = () => {
    if (selectedStaff && selectedSlot) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Staff List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold">Select Staff</h3>
          <div className="space-y-3">
            {availableStaff.length > 0 ? (
              availableStaff.map((employee) => (
              <div
                key={employee.id}
                onClick={() => handleStaffSelect(employee.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedStaff === employee.id
                    ? 'border-primary bg-primary/5 shadow-soft'
                    : 'border-border hover:border-primary/50 hover:shadow-soft'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={employee.photo} alt={employee.name} />
                    <AvatarFallback>
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{employee.name}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-yellow-500 mr-1" />
                      <span>{employee.rating}</span>
                    </div>
                    <Badge 
                      variant={employee.available ? "default" : "secondary"}
                      className="text-xs mt-1"
                    >
                      {employee.available ? 'Available' : 'Busy'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))) : (
              <div className="text-center py-4 text-muted-foreground">
                No staff members are currently available
              </div>
            )}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">
              {selectedStaff 
                ? `Available Time Slots for ${employees.find(e => e.id === selectedStaff)?.name}` 
                : 'Select a staff member to see available time slots'}
            </h3>
            <div className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
          
          {selectedStaff ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {timeSlots.map((slot) => {
                  const isBooked = isSlotBooked(selectedStaff, slot.start);
                  const isSelected = selectedSlot === slot.start;
                  const isAvailable = !isBooked;
                  
                  return (
                    <div
                      key={slot.start}
                      onClick={() => isAvailable && handleTimeSelect(slot.start)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-soft'
                          : isBooked
                            ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 cursor-not-allowed'
                            : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:shadow-soft'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${
                            isBooked 
                              ? 'text-red-700 dark:text-red-300' 
                              : 'text-green-700 dark:text-green-300'
                          }`}>
                            {slot.display}
                          </div>
                          <div className={`text-sm ${
                            isBooked 
                              ? 'text-red-500 dark:text-red-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {isBooked ? 'Booked' : 'Available'}
                          </div>
                        </div>
                        {isAvailable && (
                          <div className={`w-2 h-2 rounded-full ${
                            isSelected 
                              ? 'bg-primary dark:bg-primary-foreground' 
                              : 'bg-green-400 dark:bg-green-500'
                          }`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center bg-muted/30">
              <div className="text-muted-foreground">
                {availableStaff.length > 0
                  ? 'Please select a staff member to view available time slots'
                  : 'No staff members are currently available. Please try again later.'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!selectedStaff || !selectedSlot}
          className="min-w-32"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
