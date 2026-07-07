/**
 * Blockchain service types for VisionLedger.
 */

/** Status of a blockchain record. */
export type BlockchainStatus = "pending" | "recorded" | "failed";

/** A blockchain transaction record. */
export interface BlockchainRecord {
  id: string;
  claimId: string;
  evidenceHash: string;
  verificationHash: string;
  status: BlockchainStatus;
  txHash: string | null;
  recordedAt: string;
}

/** Data payload for recording a verification on-chain. */
export interface VerificationPayload {
  claimId: string;
  evidenceImageUrl: string;
  evidenceHash: string;
  verificationHash: string;
  treeCount: number;
  confidenceScore: number;
  claimType: string;
  timestamp: string;
}

/** Simulated transaction result. */
export interface TransactionResult {
  txHash: string;
  blockNumber: number;
  status: "success" | "failed";
  timestamp: string;
}

/** Configuration for the blockchain service. */
export interface BlockchainConfig {
  /** Whether to use simulated mode (true) or real blockchain (false). */
  simulated: boolean;
  /** Chain ID for deployment (e.g. 80002 for Polygon Amoy). */
  chainId: number;
  /** RPC URL for the blockchain network. */
  rpcUrl: string;
  /** Deployed contract address. */
  contractAddress: string;
}
