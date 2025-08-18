import React from 'react';

interface WalletConnectionProps {
  isConnected: boolean;
  address: string | null;
  balance: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = () => {
  // Delegate wallet UI entirely to Reown AppKit
  // This single button will show "Connect" when disconnected and an account chip when connected
  return <appkit-button />;
};