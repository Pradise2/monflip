import React from 'react';
import { WalletConnection } from './WalletConnection';
import { Volume2, VolumeX, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  walletAddress: string | null;
  balance: string;
  soundEnabled: boolean;
  darkMode: boolean;
  isCorrectNetwork?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleSound: () => void;
  onToggleDarkMode: () => void;
  onSwitchNetwork?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  walletAddress,
  balance,
  soundEnabled,
  isCorrectNetwork = true,
  onConnect,
  onDisconnect,
  onToggleSound,
  onSwitchNetwork
}) => {
  return (
    <header className="flex items-center justify-between p-6 bg-gray-900/50 backdrop-blur-sm border-b border-purple-500/30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-20 h-20 rounded-full overflow-hidden">
            <img src="/icon.png" alt="MonFlip Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            MonFlip
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {!isCorrectNetwork && isConnected && (
          <button
            onClick={onSwitchNetwork}
            className="flex items-center gap-2 px-3 py-2 bg-red-600/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Switch to Monad
          </button>
        )}
        
        <button
          onClick={onToggleSound}
          className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-purple-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        <WalletConnection
          isConnected={isConnected}
          address={walletAddress}
          balance={balance}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </div>
    </header>
  );
};