import React, { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Custom Monad Testnet chain for Wagmi/Viem
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
    public: { http: ['https://testnet-rpc.monad.xyz'] }
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' }
  },
} as const;

const queryClient = new QueryClient();

// Get Reown Project ID from env
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '';

// Basic metadata
const metadata = {
  name: 'MonFlip',
  description: 'High-Stakes Coin Flip on Monad',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  icons: [typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : '']
};

// Initialize Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [monadTestnet as any],
  projectId,
  ssr: false
});

// Initialize AppKit modal once
createAppKit({
  adapters: [wagmiAdapter],
  networks: [monadTestnet as any],
  projectId,
  metadata,
  features: { analytics: true }
});

export function AppKitProvider({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
