import { useEcho } from '@merit-systems/echo-react-sdk';
import { Gift } from 'lucide-react';

export default function EchoBalance() {
  const { balance, freeTierBalance } = useEcho();

  const freeTierAmountLeft = freeTierBalance?.userSpendInfo.amountLeft ?? 0;
  const totalBalance = (balance?.balance || 0) + (freeTierAmountLeft || 0);
  const hasFreeCredits = freeTierAmountLeft > 0;

  return (
    <div className="p-4">
      <div className="space-y-1 flex flex-col items-center">
        <div className="flex flex-col items-center gap-1">
          <div className="text-2xl font-semibold">
            ${totalBalance.toLocaleString()}
          </div>
          {hasFreeCredits && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>${balance?.balance?.toLocaleString() || '0'}</span>
              <span>+</span>
              <span className="flex items-center gap-1">
                ${freeTierAmountLeft.toLocaleString()} free
                <Gift className="size-3" />
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Available Credits</p>
      </div>
    </div>
  );
}
