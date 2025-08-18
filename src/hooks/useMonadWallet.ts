import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

const MONAD_TESTNET_CONFIG = {
  chainId: '0x279F', // 10143 in hex
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
};

export const useMonadWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const checkNetwork = useCallback(async (provider: ethers.BrowserProvider) => {
    try {
      const network = await provider.getNetwork();
      const isCorrect = network.chainId === BigInt(10143);
      setIsCorrectNetwork(isCorrect);
      return isCorrect;
    } catch (error) {
      console.error('Error checking network:', error);
      setIsCorrectNetwork(false);
      return false;
    }
  }, []);

  const switchToMonadTestnet = useCallback(async () => {
    if (!window.ethereum) return false;

    try {
      // Try to switch to Monad testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET_CONFIG.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [MONAD_TESTNET_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Monad testnet:', addError);
          return false;
        }
      }
      console.error('Error switching to Monad testnet:', switchError);
      return false;
    }
  }, []);

  const updateBalance = useCallback(async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const balance = await provider.getBalance(address);
      const balanceInMON = ethers.formatEther(balance);
      setBalance(parseFloat(balanceInMON).toFixed(4));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0.00');
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      // Check if we're on mobile
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        // Try to open the wallet app using deeplink
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        if (isAndroid || isIOS) {
          window.location.href = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
          return {}; // Return empty object to prevent errors
        }
      }
      throw new Error('Please install MetaMask or a Web3 wallet to continue');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      // Check if we're on the correct network
      const isCorrect = await checkNetwork(provider);
      
      if (!isCorrect) {
        const switched = await switchToMonadTestnet();
        if (!switched) {
          throw new Error('Please switch to Monad Testnet manually');
        }
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setSigner(signer);
      setAddress(address);
      setIsConnected(true);

      // Update balance
      await updateBalance(provider, address);

      return { provider, signer, address };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [checkNetwork, switchToMonadTestnet, updateBalance]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setBalance('0.00');
    setProvider(null);
    setSigner(null);
    setIsCorrectNetwork(false);
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== address) {
        // Account changed, reconnect
        setTimeout(() => {
          connectWallet().catch(console.error);
        }, 100);
      }
    };

    const handleChainChanged = (chainId: string) => {
      const isCorrect = parseInt(chainId, 16) === 10143;
      setIsCorrectNetwork(isCorrect);
      
      // Recreate provider after network change
      setTimeout(async () => {
        if (isCorrect && window.ethereum && address) {
          try {
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(newProvider);
            await updateBalance(newProvider, address);
          } catch (error) {
            console.error('Error updating provider after network change:', error);
          }
        }
      }, 100);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [address, provider, connectWallet, disconnectWallet, updateBalance]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
      }
    };

    autoConnect();
  }, []);

  return {
    isConnected,
    address,
    balance,
    provider,
    signer,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToMonadTestnet,
    updateBalance: () => provider && address ? updateBalance(provider, address) : Promise.resolve(),
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}