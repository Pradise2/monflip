import { useState, useCallback, useEffect } from 'react';
import { useFlipZoneContract } from './useFlipZoneContract';
import { ethers } from 'ethers';

export type GameState = 'idle' | 'playing' | 'won' | 'lost' | 'loading';

interface GameData {
  state: GameState;
  betAmount: string;
  currentRound: number;
  maxRounds: number;
  multiplier: number;
  potentialWin: number;
  consecutiveWins: number;
  lastFlip: 'heads' | 'tails' | null;
}

export const useGame = (signer: ethers.JsonRpcSigner | null) => {
  // Game state
  const [gameData, setGameData] = useState<GameData>({
    state: 'idle',
    betAmount: '0.1',
    currentRound: 0,
    maxRounds: 15,
    multiplier: 1.0,
    potentialWin: 0,
    consecutiveWins: 0,
    lastFlip: null
  });
  
  // Client seed and pre-calculated flips
  const [clientSeed, setClientSeed] = useState('');
  const [preCalculatedFlips, setPreCalculatedFlips] = useState<boolean[]>([]);
  const [currentFlipIndex, setCurrentFlipIndex] = useState(0);
  
  // UI state
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<'heads' | 'tails' | null>(null);
  const [nextFlipResult, setNextFlipResult] = useState<'heads' | 'tails' | null>(null);

  // Contract hooks
  const {
    currentGameId,
    gameInfo,
    isLoading: contractLoading,
    startGame: contractStartGame,
    claimReward: contractClaimReward,
    resetGame: contractResetGame
  } = useFlipZoneContract(signer);

  // Update game state when contract data changes
  useEffect(() => {
    if (gameInfo && currentGameId) {
      console.log('[useGame] Game state updated from contract');
      setGameData(prev => ({
        ...prev,
        state: gameInfo.active ? 'playing' : 'idle',
        currentRound: gameInfo.flipsCount || 0,
        potentialWin: parseFloat(ethers.formatEther(gameInfo.potentialWin.toString()))
      }));
    }
  }, [gameInfo, currentGameId]);

  // Start a new game
  const startGame = useCallback(async (betAmount: string | number, playStartSound?: () => void) => {
    if (!signer) throw new Error('Wallet not connected');
    
    try {
      // Ensure betAmount is a string and properly formatted
      const betAmountStr = typeof betAmount === 'number' ? betAmount.toString() : betAmount;
      
      // Set loading state
      setGameData(prev => ({
        ...prev,
        state: 'loading',
        betAmount: betAmountStr,
        currentRound: 0,
        multiplier: 1.0,
        potentialWin: 0,
        consecutiveWins: 0,
        lastFlip: null
      }));
      
      console.log('[useGame] Starting game with bet amount:', betAmountStr);
      
      // Start the game with the contract - this will generate and return the client seed
      const result = await contractStartGame(betAmountStr);
      
      if (!result.clientSeed) {
        throw new Error('Failed to generate client seed');
      }
      
      // Store the client seed for later use in cashout
      setClientSeed(result.clientSeed);
      
      // Pre-calculate all flip results for this game
      const flips = await generateFlipResults(result.clientSeed);
      setPreCalculatedFlips(flips);
      setCurrentFlipIndex(0);
      
      // Set the next flip result if we have pre-calculated results
      if (flips.length > 0) {
        const nextResult = flips[0] ? 'heads' : 'tails';
        setNextFlipResult(nextResult);
      }
      
      // Calculate maximum potential win (bet * 4)
      const maxPotentialWin = parseFloat(betAmountStr) * 4;
      
      // Update to playing state
      setGameData(prev => ({
        ...prev,
        state: 'playing',
        betAmount: betAmountStr,
        currentRound: 0,
        multiplier: 1.0,
        potentialWin: maxPotentialWin, // Set to max potential win from the start
        consecutiveWins: 0,
        lastFlip: null
      }));
      
      console.log('[useGame] Game started successfully');
      
      // Play start game sound if provided
      if (playStartSound) {
        try {
          playStartSound();
        } catch (error) {
          console.warn('Failed to play start sound:', error);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error starting game:', error);
      setGameData(prev => ({ ...prev, state: 'idle' }));
      throw error;
    }
  }, [signer, contractStartGame]);

  // Generate all flip results for the game
  const generateFlipResults = useCallback(async (clientSeed: string, rounds: number = 15): Promise<boolean[]> => {
    if (!signer?.provider) return [];
    
    const blockNumber = await signer.provider.getBlockNumber();
    const serverSeed = 'temporary_server_seed_placeholder'; // Replace with actual server seed from contract
    const results: boolean[] = [];
    
    for (let nonce = 0; nonce < rounds; nonce++) {
      const combined = `${clientSeed}:${serverSeed}:${nonce}:${blockNumber}`;
      const hash = ethers.keccak256(ethers.toUtf8Bytes(combined));
      const lastChar = hash.slice(-1);
      const lastCharValue = parseInt(lastChar, 16);
      results.push(lastCharValue % 2 === 0);
    }
    
    return results;
  }, [signer]);
  
  // Generate a single flip result for a specific round
  const generateFlipResult = useCallback((clientSeed: string, serverSeed: string, nonce: number, blockNumber: number): boolean => {
    const combined = `${clientSeed}:${serverSeed}:${nonce}:${blockNumber}`;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(combined));
    const lastChar = hash.slice(-1);
    const lastCharValue = parseInt(lastChar, 16);
    return lastCharValue % 2 === 0;
  }, []);

  // Handle coin flip - returns a promise that resolves when the flip is complete
  const flipCoin = useCallback(async (chosenSide: 'heads' | 'tails'): Promise<{winner: boolean, side: 'heads' | 'tails'}> => {
    if (gameData.state !== 'playing' || isFlipping || !currentGameId) {
      throw new Error('Cannot flip in current state');
    }
    
    setIsFlipping(true);
    
    try {
      // Get the next pre-calculated result
      if (currentFlipIndex >= preCalculatedFlips.length) {
        throw new Error('No more pre-calculated flip results');
      }
      
      const isHeads = preCalculatedFlips[currentFlipIndex];
      const resultSide = isHeads ? 'heads' : 'tails';
      const isWinner = resultSide === chosenSide;
      
      // Set the flip result for animation (but don't update game state yet)
      setFlipResult(resultSide);
      
      // Wait for the next render to ensure the result is set before starting the animation
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Update for next flip if there are more flips (but don't update game state yet)
      const nextIndex = currentFlipIndex + 1;
      
      if (nextIndex < preCalculatedFlips.length) {
        const nextResult = preCalculatedFlips[nextIndex] ? 'heads' : 'tails';
        setNextFlipResult(nextResult);
      } else {
        setNextFlipResult(null);
      }
      
      // Return a promise that resolves with the flip result
      // The actual game state update will happen when the animation completes
      return new Promise((resolve) => {
        // This will be called from the CoinFlip component when animation completes
        const handleAnimationComplete = () => {
          // Calculate new game state
          const newRound = gameData.currentRound + 1;
          const consecutiveWins = isWinner ? gameData.consecutiveWins + 1 : 0;
          const baseMultiplier = 1.0 + (consecutiveWins * 0.2);
          const newMultiplier = isWinner ? Math.min(baseMultiplier, 4.0) : 0;
          const newPotentialWin = parseFloat(gameData.betAmount) * 4;
          
          // Update game state after animation completes
          setGameData(prev => ({
            ...prev,
            state: isWinner ? 'playing' : 'lost',
            currentRound: newRound,
            multiplier: isWinner ? newMultiplier : 0,
            potentialWin: isWinner ? newPotentialWin : 0,
            lastFlip: resultSide,
            consecutiveWins: isWinner ? prev.consecutiveWins + 1 : 0
          }));
          
          // Update current flip index for next flip
          setCurrentFlipIndex(nextIndex);
          
          // Resolve the promise with the result
          resolve({ winner: isWinner, side: resultSide });
        };
        
        // Store the handler so CoinFlip can call it
        (window as any).__handleAnimationComplete = handleAnimationComplete;
      });
    } catch (error) {
      console.error('Error in flip logic:', error);
      throw error;
    } finally {
      setIsFlipping(false);
    }
  }, [gameData, isFlipping, currentGameId]);

  // Cash out current winnings
  const cashOut = useCallback(async () => {
    if (gameData.state !== 'playing' || gameData.currentRound === 0 || !currentGameId) {
      console.error('[cashOut] Cannot cash out - invalid game state:', { 
        state: gameData.state, 
        currentRound: gameData.currentRound, 
        currentGameId 
      });
      return null;
    }
    
    if (!clientSeed) {
      throw new Error('Client seed not found. Cannot cash out.');
    }
    
    try {
      // Calculate actual win based on current multiplier and bet amount
      
      // Only log minimal info before cashout
      console.log('[Debug] Attempting to cash out...');

      const result = await contractClaimReward(
        currentGameId,
        clientSeed,
        ethers.parseEther((parseFloat(gameData.betAmount) * gameData.multiplier).toString())
      );
      
      // After successful cashout, log all details
      console.log('[Debug] Cashout successful! Game details:', {
        gameId: currentGameId,
        clientSeed: clientSeed,
        clientSeedHash: ethers.keccak256(ethers.toUtf8Bytes(clientSeed)),
        betAmount: gameData.betAmount,
        multiplier: gameData.multiplier,
        payout: parseFloat(gameData.betAmount) * gameData.multiplier,
        result: result
      });
      
      // Update local game state
      setGameData(prev => ({
        ...prev,
        state: 'won',
        currentRound: 0,
        multiplier: 1.0,
        potentialWin: 0,
        consecutiveWins: 0,
        lastFlip: null
      }));
      
      return result;
    } catch (error) {
      console.error('Error cashing out:', error);
      throw error;
    }
  }, [contractClaimReward, currentGameId, gameData.state, gameData.currentRound, gameData.potentialWin, clientSeed]);

  // Reset the game
  const resetGame = useCallback(() => {
    setGameData({
      state: 'idle',
      betAmount: '0.1',
      currentRound: 0,
      maxRounds: 15,
      multiplier: 1.0,
      potentialWin: 0,
      consecutiveWins: 0,
      lastFlip: null
    });
    setClientSeed('');
    setPreCalculatedFlips([]);
    setCurrentFlipIndex(0);
    setFlipResult(null);
    setNextFlipResult(null);
    setIsFlipping(false);
    contractResetGame();
    console.log('[useGame] Game reset complete');
  }, [contractResetGame]);

  return {
    gameData,
    flipResult,
    nextFlipResult,
    isFlipping,
    isLoading: contractLoading,
    startGame,
    flipCoin,
    cashOut,
    resetGame
  };
};