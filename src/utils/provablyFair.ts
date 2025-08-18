import { ethers } from 'ethers';

export interface GameSeeds {
  clientSeed: string;
  clientSeedHash: string;
  serverSeed?: string;
  blockNumber?: number;
  nonce: number;
}

export interface FlipResult {
  result: boolean; // true = heads, false = tails
  randomValue: string;
  isVerifiable: boolean;
}

/**
 * Generate a cryptographically secure client seed
 */
export function generateClientSeed(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return ethers.hexlify(array);
}

/**
 * Create hash of client seed for commit phase
 */
export function hashClientSeed(clientSeed: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(clientSeed));
}

/**
 * Generate the final random value using all entropy sources
 */
export function generateRandomValue(
  clientSeed: string,
  serverSeed: string,
  blockNumber: number,
  nonce: number
): string {
  const combined = ethers.solidityPacked(
    ['string', 'bytes32', 'uint256', 'uint256'],
    [clientSeed, serverSeed, blockNumber, nonce]
  );
  return ethers.keccak256(combined);
}

/**
 * Convert random hash to flip result (heads/tails)
 */
export function hashToFlipResult(randomHash: string): boolean {
  // Use the last byte of the hash and check if it's even (heads) or odd (tails)
  const lastByte = parseInt(randomHash.slice(-2), 16);
  return lastByte % 2 === 0; // true = heads, false = tails
}

/**
 * Verify a flip result using revealed seeds
 */
export function verifyFlipResult(
  clientSeed: string,
  clientSeedHash: string,
  serverSeed: string,
  blockNumber: number,
  nonce: number,
  expectedResult: boolean
): boolean {
  // Verify client seed hash matches
  const computedHash = hashClientSeed(clientSeed);
  if (computedHash !== clientSeedHash) {
    console.error('Client seed hash mismatch');
    return false;
  }

  // Generate the random value
  const randomValue = generateRandomValue(clientSeed, serverSeed, blockNumber, nonce);
  
  // Check if the result matches
  const computedResult = hashToFlipResult(randomValue);
  
  return computedResult === expectedResult;
}

/**
 * Generate a visual representation of the randomness for transparency
 */
export function getRandomnessBreakdown(
  clientSeed: string,
  serverSeed: string,
  blockNumber: number,
  nonce: number
) {
  const randomValue = generateRandomValue(clientSeed, serverSeed, blockNumber, nonce);
  const result = hashToFlipResult(randomValue);
  const lastByte = parseInt(randomValue.slice(-2), 16);
  
  return {
    clientSeed,
    serverSeed,
    blockNumber,
    nonce,
    combinedHash: randomValue,
    lastByte,
    result: result ? 'Heads' : 'Tails',
    calculation: `${lastByte} % 2 = ${lastByte % 2} (${result ? 'Even = Heads' : 'Odd = Tails'})`
  };
}

/**
 * Create a shareable verification link
 */
export function createVerificationData(seeds: GameSeeds, flips: FlipResult[]) {
  return {
    version: '1.0',
    timestamp: Date.now(),
    seeds,
    flips: flips.map(flip => ({
      result: flip.result ? 'Heads' : 'Tails',
      randomValue: flip.randomValue,
      verified: flip.isVerifiable
    })),
    verificationUrl: `${window.location.origin}/verify`
  };
}