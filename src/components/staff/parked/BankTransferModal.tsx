import { Button } from '@/components/ui/button';

interface BankTransferState {
  orderCode: number;
  checkoutUrl: string;
  amount: number;
  plate: string;
  status: 'pending' | 'success';
}

interface BankTransferModalProps {
  bankTransfer: BankTransferState | null;
  verifying: boolean;
  penaltyRequired: boolean;
  penaltyAmount: number | null;
  penaltyPaymentMethod: 'cash' | 'wallet';
  onPenaltyPaymentMethodChange: (method: 'cash' | 'wallet') => void;
  onVerify: () => void;
  onClose: () => void;
}

export function BankTransferModal({
  bankTransfer,
  verifying,
  penaltyRequired,
  penaltyAmount,
  penaltyPaymentMethod,
  onPenaltyPaymentMethodChange,
  onVerify,
  onClose,
}: BankTransferModalProps) {
  if (!bankTransfer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Bank transfer</p>
        <h3 className="mt-1 text-xl font-semibold text-foreground">
          {bankTransfer.status === 'success' ? 'Payment received' : 'Collect parking fee'}
        </h3>
        <div className="mt-4 rounded-xl border border-border bg-card/50 p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plate</span><span className="font-semibold text-foreground">{bankTransfer.plate}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-mono text-lg font-bold text-amber-400">{bankTransfer.amount.toLocaleString('vi-VN')} đ</span></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {penaltyRequired
            ? 'The parking fee was received by bank transfer. Collect the approved penalty separately before releasing the vehicle.'
            : bankTransfer.status === 'success'
            ? 'The transfer was already received. Confirm to complete the verified checkout and release the vehicle.'
            : <>Open the payment page and let the guest scan the QR. After they transfer, tap <strong className="text-foreground">Confirm</strong>.</>}
        </p>
        {penaltyRequired && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              {penaltyAmount === null
                ? 'An approved penalty must be collected.'
                : `Pending penalty: ${penaltyAmount.toLocaleString('vi-VN')} đ`}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Penalty payment method">
              {(['cash', 'wallet'] as const).map((method) => (
                <Button
                  key={method}
                  type="button"
                  variant={penaltyPaymentMethod === method ? 'default' : 'secondary'}
                  className="capitalize"
                  aria-pressed={penaltyPaymentMethod === method}
                  onClick={() => onPenaltyPaymentMethodChange(method)}
                  disabled={verifying}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>
        )}
        {bankTransfer.status === 'pending' && (
          <Button onClick={() => window.open(bankTransfer.checkoutUrl, '_blank', 'noopener')} variant="secondary" className="mt-4 w-full gap-2">
            Open payment QR page
          </Button>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button onClick={onVerify} disabled={verifying} className="gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60">
            {verifying ? 'Confirming...' : penaltyRequired ? 'Collect penalty & complete checkout' : bankTransfer.status === 'success' ? 'Complete checkout' : 'Confirm payment'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={verifying}>Close</Button>
        </div>
      </div>
    </div>
  );
}
