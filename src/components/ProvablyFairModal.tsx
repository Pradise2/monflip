import React from 'react';
import { X, Eye } from 'lucide-react';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 text-green-400">🛡️</div>
            <h2 className="text-2xl font-bold text-white">Provably Fair Verification</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs - Removed all except Overview */}
        <div className="flex border-b border-gray-700">
          <div className="flex items-center gap-2 px-6 py-4 font-medium text-purple-400 border-b-2 border-purple-400">
            <Eye className="w-4 h-4" />
            Overview
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                🛡️ Provably Fair Gaming
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                FlipZone uses a provably fair system that combines your client seed, our server seed, 
                blockchain data, and a unique nonce to generate truly random and verifiable results. 
                
              </p>
            </div>


          </div>
        </div>


      </div>
    </div>
  );
};