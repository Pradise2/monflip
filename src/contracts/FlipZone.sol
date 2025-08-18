// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract monflip {
    address public owner;
    bool public paused;
    uint256 public gameCounter;

    struct GameSession {
        address player;
        uint256 betAmount;
        bytes32 clientSeedHash;
        bool claimed;
    }

    mapping(uint256 => GameSession) public games;

    // --- Events ---
    event GameStarted(uint256 indexed gameId, address indexed player, uint256 betAmount, bytes32 clientSeedHash);
    event GameCashedOut(uint256 indexed gameId, address indexed player, uint256 payout, string clientSeed);
    event ContractPaused();
    event ContractResumed();
    event Funded(uint256 amount);
    event Withdrawn(uint256 amount);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier notPaused() {
        require(!paused, "Game paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // --- GAME LOGIC ---

    function startGame(bytes32 clientSeedHash) external payable notPaused {
        require(msg.value > 0, "Bet required");

        gameCounter++;
        games[gameCounter] = GameSession({
            player: msg.sender,
            betAmount: msg.value,
            clientSeedHash: clientSeedHash,
            claimed: false
        });

        emit GameStarted(gameCounter, msg.sender, msg.value, clientSeedHash);
    }

    function cashout(uint256 gameId, string calldata clientSeed, uint256 payout) external {
        GameSession storage game = games[gameId];

        require(msg.sender == game.player, "Not your game");
        require(!game.claimed, "Already claimed");
        require(keccak256(abi.encodePacked(clientSeed)) == game.clientSeedHash, "Invalid clientSeed");
        require(payout <= game.betAmount * 4, "Payout too high"); // max 2x win

        game.claimed = true;
        payable(msg.sender).transfer(payout);

        emit GameCashedOut(gameId, msg.sender, payout, clientSeed);
    }

    // --- ADMIN FUNCTIONS ---

    function pauseContract() external onlyOwner {
        paused = true;
        emit ContractPaused();
    }

    function resumeContract() external onlyOwner {
        paused = false;
        emit ContractResumed();
    }

    function fundContract() external payable onlyOwner {
        emit Funded(msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
        emit Withdrawn(amount);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
        emit Withdrawn(balance);
    }

    // --- FALLBACK ---
    receive() external payable {
        emit Funded(msg.value);
    }
}