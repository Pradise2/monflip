import { useState, useCallback } from 'react';
import { ethers, Log } from 'ethers';
import { FLIPZONE_CONTRACT_ADDRESS, FLIPZONE_ABI } from '../contracts/FlipZoneContract';

export interface GameInfo {
  gameId: number;
  player: string;
  betAmount: string;
  currentRound: number;
  consecutiveWins: number;
  active: boolean;
}

export const useFlipZoneContract = (signer: ethers.JsonRpcSigner | null) => {
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getContract = useCallback(() => {
    if (!signer) throw new Error('Wallet not connected');
    return new ethers.Contract(FLIPZONE_CONTRACT_ADDRESS, FLIPZONE_ABI, signer);
  }, [signer]);

  const startGame = useCallback(async (betAmount: string, clientSeedHash: string) => {
    const contract = getContract();
    setIsLoading(true);
    try {
      const betAmountWei = ethers.parseEther(betAmount);
      const tx = await contract.startGame(clientSeedHash, { value: betAmountWei });
      const receipt = await tx.wait();

      if (!receipt.status) throw new Error('Transaction reverted');

      const gameStartedEvent = receipt.logs?.find(
        (log: any) => log.fragment?.name === 'GameStarted'
      );

      if (!gameStartedEvent?.args?.gameId) {
        throw new Error('Could not find GameStarted event.');
      }
      
      const gameId = Number(gameStartedEvent.args.gameId);
      setCurrentGameId(gameId);
      await fetchGameInfo(gameId);

      return { txHash: receipt.hash, gameId };
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signer, getContract]);

  const makeFlip = useCallback(async (gameId: number, clientSeed: string, choiceHeads: boolean) => {
    const contract = getContract();
    setIsLoading(true);
    try {
      const tx = await contract.makeFlip(gameId, clientSeed, choiceHeads);
      const receipt = await tx.wait();

      if (!receipt.status) throw new Error('Transaction reverted');
      
      const flipResultEvent = receipt.logs?.find(
        (log: any) => log.fragment?.name === 'FlipResult'
      );

      if (!flipResultEvent?.args) {
          throw new Error('Could not find FlipResult event.');
      }

      const { outcomeWasHeads, won } = flipResultEvent.args;
      return { outcomeWasHeads, won, txHash: receipt.hash };

    } catch (error) {
        console.error('Error making flip:', error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [signer, getContract]);

  const cashOut = useCallback(async (gameId: number, clientSeed: string) => {
      const contract = getContract();
      setIsLoading(true);
      try {
          const tx = await contract.cashOut(gameId, clientSeed);
          const receipt = await tx.wait();

          if (!receipt.status) throw new Error('Transaction reverted');

          return { txHash: receipt.hash };
      } catch (error) {
          console.error('Error cashing out:', error);
          throw error;
      } finally {
          setIsLoading(false);
      }
  }, [signer, getContract]);

  const fetchGameInfo = useCallback(async (gameId: number) => {
    if (!signer) return;
    try {
      const contract = getContract();
      const data = await contract.games(gameId);
      const info: GameInfo = {
        gameId,
        player: data.player,
        betAmount: ethers.formatEther(data.betAmount.toString()),
        currentRound: Number(data.currentRound),
        consecutiveWins: Number(data.consecutiveWins),
        active: data.active,
      };
      setGameInfo(info);
      return info;
    } catch (error) {
      console.error('Error fetching game info:', error);
      setGameInfo(null);
      return null;
    }
  }, [signer, getContract]);

  const resetGame = useCallback(() => {
    setCurrentGameId(null);
    setGameInfo(null);
  }, []);

  return {
    currentGameId,
    gameInfo,
    isLoading,
    startGame,
    makeFlip,
    cashOut,
    fetchGameInfo,
    resetGame,
  };
};
