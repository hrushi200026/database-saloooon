import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CreditCard, Wallet, Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import { PaymentMethod } from '@/contexts/TallyContext';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  customerPhone: string;
  onPaymentComplete: (method: PaymentMethod, upiTransactionId?: string) => Promise<void>;
}

export function PaymentDialog({ open, onOpenChange, amount, customerPhone, onPaymentComplete }: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'error' | null>(null);
  const [upiId, setUpiId] = useState('');

  const handlePayment = async (method: PaymentMethod) => {
    try {
      setIsProcessing(true);
      setSelectedMethod(method);
      
      if (method === 'upi') {
        // Simulate UPI payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        // In a real app, you would integrate with a payment gateway here
        const transactionId = `TXN${Date.now()}`;
        await onPaymentComplete('upi', transactionId);
        setPaymentStatus('success');
      } else {
        // For cash/card, mark as completed immediately
        await onPaymentComplete(method);
        setPaymentStatus('success');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a short delay to allow animations to complete
    setTimeout(() => {
      setSelectedMethod(null);
      setPaymentStatus(null);
      setUpiId('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            {!paymentStatus && `Amount to pay: ₹${amount.toLocaleString('en-IN')}`}
          </DialogDescription>
        </DialogHeader>

        {!paymentStatus && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={selectedMethod === 'cash' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => setSelectedMethod('cash')}
              >
                <Wallet className="h-6 w-6" />
                <span>Cash</span>
              </Button>
              <Button
                variant={selectedMethod === 'card' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => setSelectedMethod('card')}
              >
                <CreditCard className="h-6 w-6" />
                <span>Card</span>
              </Button>
              <Button
                variant={selectedMethod === 'upi' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => setSelectedMethod('upi')}
              >
                <Smartphone className="h-6 w-6" />
                <span>UPI</span>
              </Button>
            </div>

            {selectedMethod === 'upi' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  A payment link will be sent to {customerPhone}
                </p>
                <Input
                  placeholder="Enter UPI ID (optional)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            )}

            <Button
              className="w-full mt-4"
              disabled={!selectedMethod || isProcessing}
              onClick={() => handlePayment(selectedMethod!)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${amount.toLocaleString('en-IN')}`
              )}
            </Button>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedMethod === 'upi' 
                ? 'Payment link has been sent to customer\'s phone.'
                : 'Payment has been recorded successfully.'}
            </p>
            <Button className="mt-6" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold">Payment Failed</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedMethod === 'upi'
                ? 'Failed to send payment link. Please try again.'
                : 'Payment could not be processed. Please try again.'}
            </p>
            <Button variant="outline" className="mt-6" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
