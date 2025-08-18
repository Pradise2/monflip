import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { GameStats } from './components/GameStats';
import { TransactionStatus } from './components/TransactionStatus';
import { ProvablyFairModal } from './components/ProvablyFairModal';
import { useGame } from './hooks/useGame';
import { useSound } from './hooks/useSound';
import { Twitter, Github, MessageCircle } from 'lucide-react';
import { useAccount, useBalance, useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [betAmount, setBetAmount] = useState(0.1);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    status: 'idle' | 'pending' | 'success' | 'error';
    txHash?: string;
    message?: string;
  }>({ status: 'idle' });
  
  // Handler functions will be defined after state and hooks

  // Session stats (resets on page refresh)
  const [sessionStats, setSessionStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalWinnings: 0
  });

  // Wagmi/AppKit wallet state
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === 10143;
  const { data: walletClient } = useWalletClient();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    query: { enabled: !!address }
  });
  const { switchChainAsync } = useSwitchChain();

  // Local signer built from the connected wallet
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  useEffect(() => {
    let mounted = true;
    const makeSigner = async () => {
      try {
        if (!walletClient) {
          if (mounted) setSigner(null);
          return;
        }
        // Build an EIP-1193 provider from viem walletClient transport
        const eip1193 = {
          request: walletClient.transport.request
        } as any;
        const provider = new ethers.BrowserProvider(eip1193);
        const s = await provider.getSigner();
        if (mounted) setSigner(s);
      } catch {
        if (mounted) setSigner(null);
      }
    };
    makeSigner();
    return () => {
      mounted = false;
    };
  }, [walletClient]);

  // Derived balance string
  const balance = balanceData ? Number(balanceData.formatted).toFixed(4) : '0.00';

  // Helper to trigger a fresh balance
  const updateBalance = () => {
    if (address) refetchBalance();
  };
  
  const { 
    gameData, 
    isFlipping, 
    flipResult, 
    nextFlipResult,
    isLoading,
    startGame, 
    flipCoin, 
    cashOut, 
    resetGame
  } = useGame(signer);
  
  const { soundEnabled, toggleSound, playFlipSound, playWinSound, playLoseSound, playStartSound, playCashOutSound } = useSound();

  // Handle game state changes for sound effects and session stats
  const prevGameState = React.useRef(gameData.state);
  
  useEffect(() => {
    // Only proceed if game state has actually changed
    if (gameData.state === prevGameState.current) return;
    
    if (gameData.state === 'won') {
      playWinSound();
      updateBalance(); // Update balance after winning
      setSessionStats(prev => ({
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + 1,
        totalWinnings: prev.totalWinnings + (parseFloat(gameData.betAmount) * gameData.multiplier)
      }));
    } else if (gameData.state === 'lost') {
      playLoseSound();
      updateBalance(); // Update balance after losing
      setSessionStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1
      }));
    }
    
    // Update the ref to the current state
    prevGameState.current = gameData.state;
  }, [gameData.state, playWinSound, playLoseSound, gameData.betAmount, gameData.multiplier, updateBalance]);
  


  // Handle flip sounds
  useEffect(() => {
    if (isFlipping) {
      playFlipSound();
    }
  }, [isFlipping, playFlipSound]);

  const handleStartGame = async () => {
    if (!isConnected || !isCorrectNetwork) {
      setTxStatus({
        status: 'error',
        message: !isConnected
          ? 'Please connect your wallet using the button in the header.'
          : 'Please switch to Monad Testnet in your wallet.'
      });
      return;
    }

    try {
      setTxStatus({ status: 'pending', message: 'Starting game...' });
      await startGame(betAmount, playStartSound);
      setTxStatus({ status: 'success', message: 'Game started!' });
      
      setSessionStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
      updateBalance(); // Update balance after starting game
    } catch (error) {
      console.error('Start game error:', error);
      setTxStatus({ status: 'error', message: error instanceof Error ? error.message : 'Failed to start game' });
    }
  };

  const handleCashOut = async () => {
    try {
      setTxStatus({ status: 'pending', message: 'Cashing out...' });
      const result = await cashOut();
      if (result) {
        playCashOutSound();
        setTxStatus({ status: 'success', txHash: result.txHash, message: 'Cashout successful!' });
        updateBalance(); // Update balance after cashing out
      }
    } catch (error) {
      setTxStatus({ status: 'error', message: error instanceof Error ? error.message : 'Failed to cash out' });
    }
  };

  const handleChooseSide = async (side: 'heads' | 'tails') => {
    try {
      await flipCoin(side);
    } catch (error) {
      setTxStatus({ status: 'error', message: error instanceof Error ? error.message : 'Failed to make flip' });
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChainAsync({ chainId: 10143 });
    } catch (error) {
      setTxStatus({ status: 'error', message: 'Failed to switch to Monad Testnet' });
    }
  };

  // Define handlers after state and hooks are defined
  const handleBetAmountChange = (amount: number) => {
    setBetAmount(amount);
  };
  
  const handleFlipComplete = () => {
    // Handle flip complete if needed
  };
  
  const handleShowProvablyFair = () => {
    setShowProvablyFair(true);
  };
  
  const handleCloseProvablyFair = () => {
    setShowProvablyFair(false);
  };
  
  const closeTxStatus = () => {
    setTxStatus({ status: 'idle' });
  };
  
  const getConnectButtonText = () => {
    if (!isConnected) return 'Connect & Start';
    if (!isCorrectNetwork) return 'Switch Network & Start';
    return 'Start Game';
  };
  
  // Game is ready when connected to the correct network and not loading
  const isGameReady = isConnected && isCorrectNetwork && !isLoading;

  // Add this effect to check orientation
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    // Initial check
    checkOrientation();
    
    // Add event listener
    window.addEventListener('resize', checkOrientation);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {isPortrait && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4 text-center">
          <div className="text-2xl font-bold mb-4 text-gray-800">🔄 Please Rotate Your Device</div>
          <p className="text-gray-600 mb-6">For the best experience, please rotate your device to landscape mode.</p>
          <div className="w-32 h-32 flex items-center justify-center">
            <img 
              src="/rotate.png" 
              alt="Rotate device" 
              className="w-40 h-40 object-contain rotate-phone"
            />
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
        <TransactionStatus
          status={txStatus.status}
          txHash={txStatus.txHash}
          message={txStatus.message}
          onClose={closeTxStatus}
        />
        
        <ProvablyFairModal
          isOpen={showProvablyFair}
          onClose={handleCloseProvablyFair}
        />
        
        <Header
          isConnected={!!isConnected}
          walletAddress={address ?? null}
          balance={balance}
          soundEnabled={soundEnabled}
          darkMode={darkMode}
          isCorrectNetwork={isCorrectNetwork}
          onConnect={() => {}}
          onDisconnect={() => {}}
          onToggleSound={toggleSound}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onSwitchNetwork={handleSwitchNetwork}
        />

        <main className="py-8 w-full" style={{ marginLeft: '10px', marginRight: '10px', width: 'calc(100% - 20px)' }}>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Welcome to MonFlip
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              High-Stakes Coin Flip on Monad Testnet
            </p>
            
          </div>

          {/* Network Warning */}
          {isConnected && !isCorrectNetwork && (
            <div className="mb-8 max-w-md mx-auto">
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-center">
                <h3 className="text-red-400 font-semibold mb-2">Wrong Network</h3>
                <p className="text-red-300 text-sm mb-3">
                  Please switch to Monad Testnet to play FlipZone
                </p>
                <button
                  onClick={handleSwitchNetwork}
                  className="btn-primary"
                >
                  Switch to Monad Testnet
                </button>
              </div>
            </div>
          )}

          {/* Game Stats */}
          <GameStats
            currentMultiplier={gameData.multiplier}
            potentialWin={gameData.potentialWin}
            gamesPlayed={sessionStats.gamesPlayed}
            gamesWon={sessionStats.gamesWon}
            totalWinnings={sessionStats.totalWinnings}
          />

          {/* Game Board */}
          <GameBoard
            gameState={gameData.state === 'loading' ? 'idle' : gameData.state}
            currentRound={gameData.currentRound}
            maxRounds={gameData.maxRounds}
            isFlipping={isFlipping}
            flipResult={flipResult}
            nextFlipResult={nextFlipResult}
            multiplier={gameData.multiplier}
            betAmount={betAmount}
            onBetAmountChange={handleBetAmountChange}
            onStartGame={handleStartGame}
            onChooseSide={handleChooseSide}
            onCashOut={handleCashOut}
            onFlipComplete={handleFlipComplete}
            soundEnabled={soundEnabled}
            onShowProvablyFair={handleShowProvablyFair}
            onResetGame={resetGame}
          />

          {/* New Game Button */}
          
        </main>

        {/* Footer */}
        <footer className="border-t border-purple-500/30 bg-gray-900/50 backdrop-blur-sm p-6">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-400">Powered by Monad Testnet</p>
              <p className="text-sm text-gray-500">Built by Louzari.eth • Provably Fair Gaming</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/louzarieth"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                <Twitter className="w-5 h-5 text-gray-400 hover:text-blue-400" />
              </a>
              <a
                href="https://github.com/louzarieth"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                <Github className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="https://discord.gg/monad"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-gray-400 hover:text-purple-400" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;