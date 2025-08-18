import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { FLIPZONE_CONTRACT_ADDRESS, FLIPZONE_ABI } from '../contracts/FlipZoneContract';
import { generateClientSeed, hashClientSeed } from '../utils/provablyFair';

export interface GameInfo {
  gameId: number;
  player: string;
  betAmount: string;
  flipsCount: number;
  consecutiveWins: number;
  active: boolean;
  potentialWin: string;
  claimed: boolean;
}

export const useFlipZoneContract = (signer: ethers.JsonRpcSigner | null) => {
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [clientSeed, setClientSeed] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const getContract = useCallback(() => {
    if (!signer) throw new Error('Wallet not connected');
    return new ethers.Contract(FLIPZONE_CONTRACT_ADDRESS, FLIPZONE_ABI, signer);
  }, [signer]);

  const startGame = useCallback(async (betAmount: string) => {
    if (!signer) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    console.log('[Debug] Starting new game...');
    
    try {
      // Ensure we have the latest provider/signer
      const contract = new ethers.Contract(FLIPZONE_CONTRACT_ADDRESS, FLIPZONE_ABI, signer);
      
      // Generate new client seed for this game
      const newClientSeed = generateClientSeed();
      const clientSeedHash = hashClientSeed(newClientSeed);
      // Minimal logging for game creation
      console.log('[Debug] New game created');
      
      // Store the client seed and hash for later use
      const clientSeedData = {
        seed: newClientSeed,
        hash: clientSeedHash
      };
      setClientSeed(newClientSeed);
      
      // Ensure betAmount is a string and properly formatted
      const betAmountStr = typeof betAmount === 'number' ? betAmount.toString() : betAmount;
      
      // Convert bet amount to wei
      console.log('[Debug] Converting bet amount to wei...');
      const betAmountWei = ethers.parseEther(betAmountStr);
      
      // Check network before transaction
      const network = await signer.provider.getNetwork();
      console.log('[Debug] Verifying network...');
      
      if (network.chainId !== BigInt(10143)) {
        throw new Error('Please switch to Monad Testnet (Chain ID: 10143)');
      }
      
      // Start the game
      console.log('[Debug] Sending startGame transaction...');
      const tx = await contract.startGame(clientSeedHash, {
        value: betAmountWei,
        gasLimit: 300000
      });
      console.log('[Debug] Transaction sent, waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('[Debug] Transaction confirmed');

      if (!receipt.status) {
        throw new Error('Transaction reverted');
      }

      // Get the active game ID for this player
      const playerAddress = await signer.getAddress();
      console.log('[Debug] Fetching active game for player:', playerAddress);
      
      // Add retry logic for the activeGames call
      let activeGameId;
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          activeGameId = await contract.activeGames(playerAddress);
          console.log('[Debug] Active game ID:', activeGameId.toString());
          break;
        } catch (error) {
          lastError = error;
          retries--;
          if (retries > 0) {
            console.log(`[Debug] Retrying activeGames call... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between retries
          }
        }
      }

      if (!activeGameId) {
        console.error('[Debug] Failed to get active game ID after retries:', lastError);
        // Try to get the game ID from the event logs as a fallback
        const gameStartedEvent = receipt.logs?.find(
          (log: any) => log.fragment?.name === 'GameStarted' && log.args?.player.toLowerCase() === playerAddress.toLowerCase()
        );
        
        if (gameStartedEvent?.args?.gameId) {
          activeGameId = gameStartedEvent.args.gameId;
          console.log('[Debug] Found game from event logs');
          
          // Manually set up the initial game state since we can't read it from the contract
          setGameInfo({
            gameId: Number(activeGameId),
            player: playerAddress,
            betAmount: betAmount,
            flipsCount: 0,
            consecutiveWins: 0,
            active: true,
            potentialWin: '0',
            claimed: false
          });
        } else {
          throw new Error('Failed to get active game ID. Please refresh the page and try again.');
        }
      } else {
        // If we got the game ID directly, still fetch the game info
        try {
          await fetchGameInfo(Number(activeGameId));
        } catch (error) {
          console.warn('[Debug] Could not fetch game info, using default state:', error);
          setGameInfo({
            gameId: Number(activeGameId),
            player: playerAddress,
            betAmount: betAmount,
            flipsCount: 0,
            consecutiveWins: 0,
            active: true,
            potentialWin: '0',
            claimed: false
          });
        }
      }
      
      setCurrentGameId(Number(activeGameId));
      
      // Return both the game ID and the client seed data
      return { 
        gameId: Number(activeGameId), 
        txHash: receipt.hash,
        clientSeed: clientSeedData.seed,
        clientSeedHash: clientSeedData.hash
      };
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signer, getContract]);

  const claimReward = useCallback(async (gameId: number, clientSeed: string, payout: string) => {
    if (!signer) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      // Ensure we have the latest provider/signer
      const contract = new ethers.Contract(FLIPZONE_CONTRACT_ADDRESS, FLIPZONE_ABI, signer);
      
      // Check network before transaction
      const network = await signer.provider.getNetwork();
      if (network.chainId !== BigInt(10143)) {
        throw new Error('Please switch to Monad Testnet (Chain ID: 10143)');
      }
      
      // Convert parameters to required types
      const gameIdBN = ethers.getBigInt(gameId); // Convert to BigInt for uint256
      const payoutBN = ethers.getBigInt(payout); // Convert payout to BigInt for uint256
      
      console.log('[Debug] Attempting to cash out...');
      
      // Call the cashout function with properly typed parameters
      const tx = await contract.cashout(
        gameIdBN,   // uint256
        clientSeed, // string
        payoutBN,   // uint256
        {
          gasLimit: 300000  // Increased gas limit for the transaction
        }
      );
      
      const receipt = await tx.wait();
      
      if (!receipt.status) {
        throw new Error('Transaction reverted');
      }
      
      // Update game info after claiming
      await fetchGameInfo(gameId);
      
      return { 
        txHash: receipt.hash,
        gameId,
        amount: payout // Use the payout parameter that was passed in
      };
    } catch (error) {
      console.error('Error claiming reward:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signer, getContract]);

  const fetchGameInfo = useCallback(async (gameId: number) => {
    if (!signer) return;
    
    try {
      // Use the provider directly to call the contract
      const provider = signer.provider;
      if (!provider) throw new Error('No provider available');
      
      // Create an interface with just the games function signature
      const iface = new ethers.Interface([
        'function games(uint256) view returns (address player, uint256 betAmount, bytes32 clientSeedHash, bool claimed)'
      ]);
      
      // Encode the function call
      const data = iface.encodeFunctionData('games', [gameId]);
      
      // Call the contract directly
      const result = await provider.call({
        to: FLIPZONE_CONTRACT_ADDRESS,
        data: data
      });
      
      // Decode the result manually
      const [player, betAmount, clientSeedHash, claimed] = iface.decodeFunctionResult('games', result);
      
      console.log('[Debug] Fetched game data:', {
        gameId,
        player,
        betAmount: betAmount.toString(),
        clientSeedHash,
        claimed: Boolean(claimed)
      });
      
      // Create the game info object with the correct types
      const gameInfo: GameInfo = {
        gameId,
        player,
        betAmount: ethers.formatEther(betAmount.toString()),
        flipsCount: 0, // Not stored in the contract
        consecutiveWins: 0, // Not stored in the contract
        active: !claimed, // active = !claimed
        potentialWin: '0', // Not stored in the contract
        claimed: Boolean(claimed)
      };
      
      console.log('[Debug] Decoded game info:', gameInfo);
      setGameInfo(gameInfo);
      return gameInfo;
    } catch (error) {
      console.error('Error fetching game info:', error);
      throw error;
    }
  }, [signer, getContract]);

  const makeFlip = useCallback(async (gameId: number, isHeads: boolean) => {
    if (!signer) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      const contract = new ethers.Contract(FLIPZONE_CONTRACT_ADDRESS, FLIPZONE_ABI, signer);
      
      // Check network before transaction
      const network = await signer.provider.getNetwork();
      if (network.chainId !== BigInt(10143)) {
        throw new Error('Please switch to Monad Testnet (Chain ID: 10143)');
      }
      
      const tx = await contract.flip(gameId, isHeads, {
        gasLimit: 300000
      });
      
      const receipt = await tx.wait();
      
      if (!receipt.status) {
        throw new Error('Transaction reverted');
      }
      
      // Find the FlipResult event in the receipt logs
      const flipResultEvent = receipt.logs?.find(
        (log: any) => log.fragment?.name === 'FlipResult'
      );
      
      if (!flipResultEvent) {
        throw new Error('Could not find FlipResult event in transaction receipt');
      }
      
      const { gameId: eventGameId, result, won, consecutiveWins, potentialWin } = flipResultEvent.args;
      
      // Update game info after flip
      const updatedGameInfo = await fetchGameInfo(Number(eventGameId));
      
      return {
        result: result, // true for heads, false for tails
        won: won,
        consecutiveWins: Number(consecutiveWins),
        potentialWin: potentialWin.toString(),
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Error making flip:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  const resetGame = useCallback(() => {
    setCurrentGameId(null);
    setGameInfo(null);
    setClientSeed('');
  }, []);

  return {
    currentGameId,
    gameInfo,
    isLoading,
    startGame,
    makeFlip,
    claimReward,
    fetchGameInfo,
    resetGame,
    clientSeed
  };
};