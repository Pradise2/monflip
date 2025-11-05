import { useState, useCallback, useEffect } from 'react';
import { useFlipZoneContract } from './useFlipZoneContract';
import { ethers } from 'ethers';
import { generateClientSeed, hashClientSeed } from '../utils/provablyFair';

export type GameState = 'idle' | 'playing' | 'won' | 'lost' | 'loading';

interface GameData {
  state: GameState;
  betAmount: string;
  currentRound: number;
  maxRounds: number;
  multiplier: number;
  potentialWin: number;
  consecutiveWins: number;
}

export const useGame = (signer: ethers.JsonRpcSigner | null) => {
  const [gameData, setGameData] = useState<GameData>({
    state: 'idle',
    betAmount: '0.1',
    currentRound: 0,
    maxRounds: 15,
    multiplier: 1.0,
    potentialWin: 0,
    consecutiveWins: 0,
  });

  const [clientSeed, setClientSeed] = useState<string>('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<'heads' | 'tails' | null>(null);

  const {
    currentGameId,
    gameInfo,
    isLoading: contractLoading,
    startGame: contractStartGame,
    makeFlip: contractMakeFlip,
    cashOut: contractCashOut,
    resetGame: contractResetGame,
    fetchGameInfo,
  } = useFlipZoneContract(signer);

  // Sync UI with contract state
  useEffect(() => {
    if (gameInfo && currentGameId) {
      const multiplier = 1.5 ** gameInfo.consecutiveWins;
      const potentialWin = parseFloat(gameInfo.betAmount) * multiplier;

      setGameData(prev => ({
        ...prev,
        state: gameInfo.active ? 'playing' : 'idle',
        betAmount: gameInfo.betAmount,
        currentRound: gameInfo.currentRound,
        consecutiveWins: gameInfo.consecutiveWins,
        multiplier,
        potentialWin,
      }));

      // If game is no longer active and wasn't a win, it's a loss
      if (!gameInfo.active && prev.state !== 'won' && prev.state !== 'idle') {
        setGameData(prev => ({ ...prev, state: 'lost' }));
      }

    } else if (!currentGameId) {
        // Handle reset or initial state
        setGameData(prev => ({ ...prev, state: 'idle' }));
    }
  }, [gameInfo, currentGameId]);

  const startGame = useCallback(async (betAmount: number, playStartSound?: () => void) => {
    if (!signer) throw new Error('Wallet not connected');

    setGameData(prev => ({ ...prev, state: 'loading' }));
    
    const newClientSeed = generateClientSeed();
    const clientSeedHash = hashClientSeed(newClientSeed);
    setClientSeed(newClientSeed);

    try {
      const result = await contractStartGame(betAmount.toString(), clientSeedHash);
      playStartSound?.();
      // State will be updated by the useEffect hook watching gameInfo
      return result;
    } catch (error) {
      console.error('Error starting game:', error);
      setGameData(prev => ({ ...prev, state: 'idle' }));
      setClientSeed('');
      throw error;
    }
  }, [signer, contractStartGame]);

  const flipCoin = useCallback(async (chosenSide: 'heads' | 'tails') => {
    if (gameData.state !== 'playing' || !currentGameId || !clientSeed) {
      throw new Error('Cannot flip in current state');
    }
    
    setIsFlipping(true);
    setFlipResult(null);

    try {
      const choiceIsHeads = chosenSide === 'heads';
      const result = await contractMakeFlip(currentGameId, clientSeed, choiceIsHeads);

      const outcomeSide = result.outcomeWasHeads ? 'heads' : 'tails';
      setFlipResult(outcomeSide);
      
      // onFlipComplete will handle the rest after animation
      return new Promise<{ winner: boolean, side: 'heads' | 'tails' }>((resolve) => {
        (window as any).__handleAnimationComplete = () => {
          if (result.won) {
            fetchGameInfo(currentGameId); // Refresh state from contract
          }
          // The useEffect will catch the state change to 'lost' if !result.won
          resolve({ winner: result.won, side: outcomeSide });
        };
      });
    } catch (error) {
      setIsFlipping(false);
      console.error('Error making flip:', error);
      throw error;
    }
  }, [gameData.state, currentGameId, clientSeed, contractMakeFlip, fetchGameInfo]);

  // To be called by CoinFlip component's onFlipComplete
  const handleFlipAnimationComplete = () => {
    setIsFlipping(false);
    if (typeof (window as any).__handleAnimationComplete === 'function') {
      (window as any).__handleAnimationComplete();
      delete (window as any).__handleAnimationComplete;
    }
  };

  const cashOut = useCallback(async () => {
    if (gameData.state !== 'playing' || gameData.consecutiveWins === 0 || !currentGameId || !clientSeed) {
      throw new Error('Invalid state for cash out');
    }

    try {
      const result = await contractCashOut(currentGameId, clientSeed);
      setGameData(prev => ({ ...prev, state: 'won' }));
      return result;
    } catch (error) {
      console.error('Error cashing out:', error);
      throw error;
    }
  }, [contractCashOut, currentGameId, clientSeed, gameData.state, gameData.consecutiveWins]);

  const resetGame = useCallback(() => {
    setGameData({
      state: 'idle',
      betAmount: '0.1',
      currentRound: 0,
      maxRounds: 15,
      multiplier: 1.0,
      potentialWin: 0,
      consecutiveWins: 0,
    });
    setClientSeed('');
    setFlipResult(null);
    setIsFlipping(false);
    contractResetGame();
  }, [contractResetGame]);

  return {
    gameData,
    isFlipping,
    flipResult,
    isLoading: contractLoading,
    startGame,
    flipCoin,
    handleFlipAnimationComplete, // Pass this down to GameBoard -> CoinFlip
    cashOut,
    resetGame,
  };
};
