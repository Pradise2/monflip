import React, { useState } from 'react';
import { CoinFlip } from './CoinFlip';
import { Coins, TrendingUp, Shield } from 'lucide-react';

interface GameBoardProps {
  gameState: 'idle' | 'playing' | 'won' | 'lost';
  currentRound: number;
  maxRounds: number;
  isFlipping: boolean;
  flipResult: 'heads' | 'tails' | null;
  nextFlipResult: 'heads' | 'tails' | null;
  multiplier: number;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onStartGame: () => void;
  onChooseSide: (side: 'heads' | 'tails') => void;
  onCashOut: () => void;
  onFlipComplete: () => void;
  soundEnabled: boolean;
  onShowProvablyFair?: () => void;
  onResetGame?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentRound,
  maxRounds,
  isFlipping,
  flipResult,
  multiplier,
  betAmount,
  onBetAmountChange,
  onStartGame,
  onChooseSide,
  onCashOut,
  onFlipComplete,
  soundEnabled,
  onShowProvablyFair,
  onResetGame
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string>('Background-moncock.svg');
  const canPlay = gameState === 'playing' && !isFlipping;
  const canCashOut = gameState === 'playing' && currentRound > 0 && !isFlipping;
  const isGameActive = gameState === 'playing' || gameState === 'won' || gameState === 'lost';
  const isIdle = gameState === 'idle';

  const handleCharacterSelect = (name: string) => {
    // Set the corresponding background image based on character
    if (name === 'Moncock') {
      setBackgroundImage('Background-moncock.svg');
    } else if (name === 'Molandak') {
      setBackgroundImage('Background-choc.svg');
    } else if (name === 'CHOG') {
      setBackgroundImage('Background-monlandak.svg');
    } else {
      setBackgroundImage('Background-moncock.svg');
    }
  };

  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ paddingTop: 'min(56.25%, 100vh)' }}>
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          maxWidth: '1920px',
          maxHeight: '1080px',
          margin: '0 auto',
          transition: 'background-image 0.5s ease-in-out'
        }}
      >
        <div className="relative w-full h-full" style={{ aspectRatio: '16/9' }}>
          {/* Coin Area */}
          <div className="absolute top-[52%] left-[57%] transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
            {isGameActive && (
              <CoinFlip 
                isFlipping={isFlipping}
                result={flipResult}
                nextResult={null} // This will be updated when we connect it to the useGame hook
                onFlipComplete={onFlipComplete}
              />
            )}
          </div>

          {/* Heads Button - Always visible, left side */}
          <button
            onClick={() => !isFlipping && currentRound < 15 && onChooseSide('heads')}
            disabled={isFlipping || gameState !== 'playing' || currentRound >= 15}
            className={`absolute left-[30%] bottom-[5%] w-[10%] h-[8%] min-w-[3px] max-w-[300px] flex items-center justify-center
              bg-black/50 backdrop-blur-sm px-[1.5vw] py-[1vw] rounded-full transition-all
              ${!isFlipping && gameState === 'playing' && currentRound < 15 ? 'opacity-100 cursor-pointer hover:bg-black/60' : 'opacity-50 cursor-not-allowed'}`}
            >
            <span className="text-white text-[1.2vw] sm:text-sm md:text-base lg:text-lg font-medium whitespace-nowrap">Heads</span>
          </button>

          {/* Character Selection Buttons */}
          <>
            {/* Button 1 - Top Left */}
            <button 
              onClick={() => handleCharacterSelect('Moncock')}
              className="absolute top-[15%] left-[19.5%] w-[15%] h-[25%] min-w-[40px] min-h-[40px] max-w-[20%] max-h-[30%] rounded-full bg-white/1 hover:bg-white/10 transition-all z-10 transform rotate-90"
              title="Moncock"
              aria-label="Select Moncock background"
            />

            {/* Button 2 - Top Right */}
            <button 
              onClick={() => handleCharacterSelect('Molandak')}
              className="absolute top-[15%] right-[24.5%] w-[13%] h-[23%] min-w-[40px] min-h-[40px] max-w-[15%] max-h-[25%] rounded-full bg-white/1 hover:bg-white/10 transition-all z-10 transform rotate-90"
              title="Molandak"
              aria-label="Select Molandak background"
            />

            {/* Button 3 - Bottom Right */}
            <button 
              onClick={() => handleCharacterSelect('CHOG')}
              className="absolute bottom-[46%] right-[13%] w-[14%] h-[25%] min-w-[40px] min-h-[40px] max-w-[17%] max-h-[25%] rounded-full bg-white/1 hover:bg-white/10 transition-all z-10 transform rotate-90"
              title="CHOG"
              aria-label="Select CHOG background"
            />
          </>

          {/* Tails Button - Always visible, below bet amount */}
          <button
            onClick={() => !isFlipping && currentRound < 15 && onChooseSide('tails')}
            disabled={isFlipping || gameState !== 'playing' || currentRound >= 15}
            className={`absolute right-[30%] bottom-[5%] w-[10%] h-[8%] min-w-[3px] max-w-[300px] flex items-center justify-center
              bg-black/50 backdrop-blur-sm px-[1.5vw] py-[1vw] rounded-full transition-all
              ${!isFlipping && gameState === 'playing' && currentRound < 15 ? 'opacity-100 cursor-pointer hover:bg-black/60' : 'opacity-50 cursor-not-allowed'}`}
            >
            <span className="text-white text-[1.2vw] sm:text-sm md:text-base lg:text-lg font-medium whitespace-nowrap">Tails</span>
          </button>

          {/* Cash Out Button - Always visible, positioned at 20% from left and 30% from bottom */}
          <button
            onClick={onCashOut}
            className={`absolute left-[20%] bottom-[15%] w-[26%] h-[7%] min-w-[3px] max-w-[3000px] transform -translate-x-1/2 flex items-center justify-center gap-[0.5vw]
              bg-black/50 backdrop-blur-sm px-[1.5vw] py-[1vw] rounded-full transition-all
              ${canCashOut && !isFlipping ? 'opacity-100 cursor-pointer hover:bg-black/60' : 'opacity-50 cursor-not-allowed'}
              min-w-[120px] min-h-[40px] w-auto`}
            disabled={!canCashOut || isFlipping}
          >
            <TrendingUp className="w-[1.2vw] h-[1.2vw] sm:w-4 sm:h-4" />
            <span className="text-white text-[1.2vw] sm:text-sm md:text-base lg:text-lg font-medium whitespace-nowrap">Cash Out</span>
          </button>

          {/* Bet Amount and Action Buttons - Positioned at 12% from right and 15% from bottom */}
          <div className="absolute right-[7%] bottom-[15%] w-[24%] max-w-[300px] min-w-[200px]">
            {isIdle ? (
              <div className="flex items-center justify-between gap-[0.5vw] bg-black/50 backdrop-blur-sm px-[1.5vw] py-[0.8vw] rounded-full">
                <span className="text-white text-[1.8vw] sm:text-sm md:text-base lg:text-lg">Bet</span>
                <div className="flex-1 flex items-center justify-center">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value);
                      if (isNaN(value)) value = 0.1;
                      value = Math.max(0.1, Math.min(10, value)); // Ensure value is between 0.1 and 10
                      onBetAmountChange(value);
                    }}
                    onBlur={(e) => {
                      let value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0.1) value = 0.1;
                      if (value > 10) value = 10;
                      onBetAmountChange(parseFloat(value.toFixed(1)));
                    }}
                    className="w-full bg-transparent border-0 text-white text-center focus:ring-0 focus:outline-none text-[1.2vw] text-xs sm:text-sm md:text-sm lg:text-base"
                    min="0.1"
                    max="10"
                    step="0.1"
                    disabled={isFlipping}
                  />
                </div>
                <button
                  onClick={onStartGame}
                  className="ml-2 px-[1.5vw] py-[0.4vw] min-w-[60px] bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors text-[0.9vw] sm:text-xs md:text-sm whitespace-nowrap"
                  disabled={isFlipping}
                >
                  Start
                </button>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-center bg-black/50 backdrop-blur-sm px-[1.5vw] py-[0.8vw] rounded-full">
                  <div className="text-center">
                    <span className="text-white text-[0.8vw] sm:text-xs md:text-lg whitespace-nowrap">
                      Bet: <span className="font-bold">{betAmount} MON</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* New Game Button - Centered at bottom */}
          {(gameState === 'won' || gameState === 'lost') && onResetGame && (
            <div className="absolute bottom-[5%] left-1/2 transform -translate-x-1/2">
              <button
                onClick={onResetGame}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-full transition-all shadow-lg transform hover:scale-105"
              >
                <span className="text-sm sm:text-base md:text-lg">New Game</span>
              </button>
            </div>
          )}

          {/* Multiplier and Info Row - Positioned at top right */}
          <div className="absolute top-[2%] right-[2%] bg-black/50 backdrop-blur-sm rounded-lg p-[1.5%] w-[18%] h-[13%] min-w-[10px] max-w-[300px]">
            <div className="flex items-center justify-between w-full h-full">
              <div className="text-center w-1/3">
                <div className="text-gray-400 text-[1.1vw] sm:text-xs md:text-sm lg:text-base">Round</div>
                <div className="text-white font-bold text-[1.3vw] sm:text-base md:text-lg lg:text-xl">
                  {currentRound}/{maxRounds}
                </div>
              </div>
              <div className="text-center w-1/3">
                <div className="text-gray-400 text-[1.1vw] sm:text-xs md:text-sm lg:text-base">Win</div>
                <div className="text-green-400 font-bold text-[1.1vw] sm:text-sm md:text-base lg:text-lg whitespace-nowrap">
                  {(betAmount * multiplier).toFixed(2)} MON
                </div>
              </div>
              <div className="text-center w-1/3">
                <div className="text-gray-400 text-[1.1vw] sm:text-xs md:text-sm lg:text-base"></div>
                <button
                  onClick={onShowProvablyFair}
                  className="text-purple-400 hover:text-purple-300 transition-colors text-[1.1vw] sm:text-xs md:text-sm lg:text-base"
                >
                  Fair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};