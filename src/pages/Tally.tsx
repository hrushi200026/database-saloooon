import { format, isSameDay, parseISO } from 'date-fns';
import { Download, CheckCircle2, XCircle, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { useTally } from '@/contexts/TallyContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function TallyPage() {
  const { tallyItems } = useTally();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Filter tally items by selected date
  const filteredTallyItems = selectedDate 
    ? tallyItems.filter(item => isSameDay(parseISO(item.date), selectedDate))
    : tallyItems;
    
  // Get unique dates for the calendar
  const availableDates = Array.from(new Set(
    tallyItems.map(item => item.date.split('T')[0])
  )).map(date => new Date(date));

  const handleExport = () => {
    // Convert data to CSV
    const headers = [
      'Sr. No',
      'Date',
      'Time',
      'Customer Name',
      'Staff Name',
      'Services',
      'Amount',
      'Payment Method',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...tallyItems.map((item, index) => (
        [
          index + 1,
          format(new Date(item.date), 'dd/MM/yyyy'),
          item.time,
          `"${item.customerName}"`,
          `"${item.staffName}"`,
          `"${item.services.map(s => `${s.name} (${s.price})`).join(', ')}"`,
          item.totalCost,
          item.paymentMethod.toUpperCase(),
          item.paymentStatus.toUpperCase()
        ].join(',')
      ))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tally_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Tally Records</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full md:w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date > new Date()}
                modifiers={{
                  hasRecords: availableDates.map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()))
                }}
                modifiersStyles={{
                  hasRecords: {
                    border: '2px solid #22c55e',
                    borderRadius: '50%'
                  }
                }}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
          <Button 
            onClick={handleExport} 
            className="gap-2 w-full md:w-auto"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of all payment records.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Sr. No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTallyItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {selectedDate 
                    ? `No records found for ${format(selectedDate, 'MMMM d, yyyy')}`
                    : 'No records found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTallyItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{item.time}</TableCell>
                  <TableCell>{item.customerName}</TableCell>
                  <TableCell>{item.staffName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {item.services.map((service, i) => (
                        <div key={i} className="text-sm">
                          {service.name} - ₹{service.price}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{item.paymentMethod}</span>
                  </TableCell>
                  <TableCell>
                    {item.paymentStatus === 'completed' ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    ) : item.paymentStatus === 'failed' ? (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    ) : item.paymentStatus === 'cancelled' ? (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelled
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{item.totalCost.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Summary Section */}
        {filteredTallyItems.length > 0 && (
          <div className="border-t bg-muted/30">
            <div className="flex flex-col items-end px-6 py-3 space-y-2">
              {/* Subtotal (Completed + Cancelled) */}
              <div className="flex items-center justify-between w-64">
                <span className="font-medium">Subtotal (Paid + Cancelled):</span>
                <span className="font-medium">
                  ₹{filteredTallyItems
                    .filter(item => ['completed', 'cancelled'].includes(item.paymentStatus))
                    .reduce((sum, item) => sum + item.totalCost, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
              
              {/* Cancelled Amount */}
              <div className="flex items-center justify-between w-64">
                <span className="font-medium text-amber-700">Cancelled Amount:</span>
                <span className="font-medium text-amber-700">
                  ₹{filteredTallyItems
                    .filter(item => item.paymentStatus === 'cancelled')
                    .reduce((sum, item) => sum + item.totalCost, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
              
              {/* Total Earning (Subtotal - Cancelled) */}
              <div className="flex items-center justify-between w-64 pt-2 border-t">
                <span className="font-semibold">Total Earning:</span>
                <span className="text-lg font-bold">
                  ₹{filteredTallyItems
                    .filter(item => item.paymentStatus === 'completed')
                    .reduce((sum, item) => sum + item.totalCost, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
