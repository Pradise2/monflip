import React from 'react';
import { Trophy, Target, TrendingUp, Zap } from 'lucide-react';

interface GameStatsProps {
  currentMultiplier: number;
  potentialWin: number;
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
}

export const GameStats: React.FC<GameStatsProps> = ({
  currentMultiplier,
  potentialWin,
  gamesPlayed,
  gamesWon,
  totalWinnings
}) => {
  const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span className="text-sm text-gray-400">Current Multiplier</span>
        </div>
        <div className="text-2xl font-bold text-green-400">
          {currentMultiplier.toFixed(2)}x
        </div>
      </div>
      
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-gray-400">Potential Win</span>
        </div>
        <div className="text-2xl font-bold text-yellow-400">
          {potentialWin.toFixed(2)} MON
        </div>
      </div>
      
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-gray-400">Win Rate</span>
        </div>
        <div className="text-2xl font-bold text-blue-400">
          {winRate.toFixed(1)}%
        </div>
      </div>
      
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-gray-400">Total Winnings</span>
        </div>
        <div className="text-2xl font-bold text-purple-400">
          {totalWinnings.toFixed(2)} MON
        </div>
      </div>
    </div>
  );
};