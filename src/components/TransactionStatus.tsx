import React from 'react';
import { CheckCircle, XCircle, Loader, ExternalLink } from 'lucide-react';

interface TransactionStatusProps {
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: string;
  message?: string;
  onClose: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  txHash,
  message,
  onClose
}) => {
  React.useEffect(() => {
    // Only auto-dismiss success or error messages, not pending ones
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        onClose();
      }, 10000); // Auto-close after 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);
  if (status === 'idle') return null;

  const getIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader className="w-6 h-6 animate-spin text-yellow-400" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-yellow-500/50 bg-yellow-900/50';
      case 'success':
        return 'border-green-500/50 bg-green-900/50';
      case 'error':
        return 'border-red-500/50 bg-red-900/50';
      default:
        return '';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`p-4 rounded-xl border backdrop-blur-sm ${getStatusColor()}`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">
                {status === 'pending' && 'Transaction Pending'}
                {status === 'success' && 'Transaction Confirmed'}
                {status === 'error' && 'Transaction Failed'}
              </h4>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            {message && (
              <p className="text-sm text-gray-300 mt-1">{message}</p>
            )}
            {txHash && (
              <a
                href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 mt-2"
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};