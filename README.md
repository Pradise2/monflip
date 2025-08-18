# FlipZone - Provably Fair Coin Flip Game on Monad

FlipZone is a decentralized coin flip game built on the Monad blockchain that implements provably fair gaming using commit-reveal schemes with enhanced entropy sources.

## 🎮 Game Features

- **Provably Fair Gaming**: Uses client seed + server seed + blockchain data + nonce for verifiable randomness
- **Progressive Multipliers**: Win up to 15 consecutive flips with 1.5x multiplier per win
- **Real-time Gameplay**: Smooth coin flip animations with sound effects
- **Wallet Integration**: Connect with MetaMask to Monad Testnet
- **Transparency**: Full seed verification and game history
- **Mobile Responsive**: Optimized for all devices

## 🔒 Provably Fair System

FlipZone implements a robust provably fair system:

1. **Client Seed**: Generated securely in your browser
2. **Server Seed**: Generated using blockchain data (block hash, timestamp, etc.)
3. **Commit-Reveal**: Client seed is hashed and committed before gameplay
4. **Enhanced Entropy**: Combines multiple randomness sources
5. **Verification**: All seeds revealed after game completion for independent verification

### Randomness Generation

```solidity
keccak256(abi.encodePacked(clientSeed, serverSeed, blockNumber, nonce))
```

The final hash determines the flip result: even = heads, odd = tails.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- MON tokens on Monad Testnet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/flipzone.git
cd flipzone
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Monad Testnet Configuration

- **Network Name**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143
- **Currency Symbol**: MON
- **Block Explorer**: https://explorer.monad.xyz

## 🎯 How to Play

1. **Connect Wallet**: Connect your MetaMask to Monad Testnet
2. **Start Game**: Choose your bet amount and start a new game
3. **Make Flips**: Choose heads or tails for each flip
4. **Win or Cash Out**: Continue playing for higher multipliers or cash out anytime
5. **Verify Results**: Check the provably fair verification after each game

## 🏗️ Smart Contract

The FlipZone smart contract is deployed on Monad Testnet and includes:

- Game state management
- Provably fair randomness generation
- Automatic payout calculations
- Seed commitment and revelation
- Player game history

### Key Functions

- `startGame(bytes32 clientSeedHash, uint8 maxFlips)`: Start a new game
- `makeFlip(uint256 gameId, bool chooseHeads, string clientSeed)`: Make a flip
- `cashOut(uint256 gameId)`: Cash out current winnings
- `getGameSeeds(uint256 gameId)`: Get seeds for verification

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Blockchain**: Monad Testnet, Solidity
- **Web3**: ethers.js v6
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom animations

## 🔐 Security Features

- **Commit-Reveal Scheme**: Prevents manipulation of randomness
- **Multiple Entropy Sources**: Blockchain data, timestamps, player address
- **Client-Side Seed Generation**: Cryptographically secure randomness
- **Transparent Verification**: All seeds revealed post-game
- **Smart Contract Auditing**: Open source for community review

## 📱 Mobile Support

FlipZone is fully responsive and optimized for mobile devices with:

- Touch-friendly interface
- Optimized coin flip animations
- Mobile wallet integration
- Responsive typography and spacing

## 🎨 Design Features

- **Dark Theme**: Monad-inspired purple and blue gradients
- **Smooth Animations**: CSS transitions and keyframe animations
- **Glass Morphism**: Modern backdrop blur effects
- **Micro-interactions**: Hover states and button feedback
- **Sound Effects**: Optional audio feedback for flips and wins

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Monad blockchain team for the testnet infrastructure
- Web3 community for development tools and libraries
- Players and testers for feedback and improvements

## 📞 Support

For support, questions, or feedback:

- Twitter: [@YourTwitter](https://twitter.com/your-twitter)
- Discord: [Your Discord](https://discord.gg/your-discord)
- GitHub Issues: [Create an issue](https://github.com/your-username/flipzone/issues)

---

**Disclaimer**: This is a testnet application for demonstration purposes. Always gamble responsibly and never bet more than you can afford to lose.