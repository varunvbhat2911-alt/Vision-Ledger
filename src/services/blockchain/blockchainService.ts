import { supabase } from "../../lib/supabase";
import { HashService } from "./hashService";
import type {
  BlockchainRecord,
  VerificationPayload,
  TransactionResult,
  BlockchainConfig,
} from "./types";

/**
 * Default configuration — simulated mode.
 * Real blockchain integration will use Polygon Amoy testnet.
 */
const DEFAULT_CONFIG: BlockchainConfig = {
  simulated: true,
  chainId: 80002, // Polygon Amoy
  rpcUrl: "https://rpc-amoy.polygon.technology",
  contractAddress: "", // Set after deployment
};

/**
 * Blockchain Service for VisionLedger.
 *
 * In simulated mode, records are stored in Supabase with SHA-256 hashes.
 * When real blockchain integration is activated, this service will:
 * 1. Connect to the deployed smart contract via ethers.js
 * 2. Submit verification hashes on-chain
 * 3. Provide on-chain audit retrieval
 *
 * The interface remains identical regardless of mode.
 */
export class BlockchainService {
  private config: BlockchainConfig;

  constructor(config: Partial<BlockchainConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a verification on the blockchain (or simulated blockchain via Supabase).
   *
   * @returns The blockchain record with transaction hash.
   */
  async recordVerification(payload: VerificationPayload): Promise<BlockchainRecord> {
    // Generate cryptographic hashes
    const evidence = `${payload.claimId}:${payload.evidenceImageUrl}:${payload.timestamp}`;
    const evidenceHash = await HashService.sha256(evidence);

    const verificationHash = await HashService.generateVerificationHash(
      evidenceHash,
      payload.treeCount,
      payload.confidenceScore,
      payload.claimType,
    );

    let txHash: string;
    let status: "recorded" | "failed";

    if (this.config.simulated) {
      // Simulate blockchain transaction
      const simulatedTx = this.simulateTransaction(payload, evidenceHash, verificationHash);
      txHash = simulatedTx.txHash;
      status = "recorded";
    } else {
      // Real blockchain integration — call smart contract
      try {
        const result = await this.submitToChain(payload, evidenceHash, verificationHash);
        txHash = result.txHash;
        status = result.status === "success" ? "recorded" : "failed";
      } catch {
        txHash = "";
        status = "failed";
      }
    }

    // Get the current authenticated user
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    // Store in Supabase
    const { data, error } = await supabase
      .from("blockchain_records")
      .insert({
        user_id: userId,
        claim_id: payload.claimId,
        evidence_hash: evidenceHash,
        verification_hash: verificationHash,
        verification_type: payload.claimType,
        status,
        tx_hash: txHash || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to save blockchain record.");
    }

    return {
      id: data.id,
      claimId: data.claim_id,
      evidenceHash: data.evidence_hash,
      verificationHash: data.verification_hash,
      status: data.status,
      txHash: data.tx_hash,
      recordedAt: data.recorded_at,
    };
  }
  /**
   * Get blockchain records for a specific claim.
   */
  async getVerification(claimId: string): Promise<BlockchainRecord | null> {
    const { data, error } = await supabase
      .from("blockchain_records")
      .select("*")
      .eq("claim_id", claimId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      claimId: data.claim_id,
      evidenceHash: data.evidence_hash,
      verificationHash: data.verification_hash,
      status: data.status,
      txHash: data.tx_hash,
      recordedAt: data.recorded_at,
    };
  }

  /**
   * Get all blockchain records (for audit history).
   */
  async getHistory(): Promise<BlockchainRecord[]> {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from("blockchain_records")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      claimId: row.claim_id,
      evidenceHash: row.evidence_hash,
      verificationHash: row.verification_hash,
      status: row.status,
      txHash: row.tx_hash,
      recordedAt: row.recorded_at,
    }));
  }

  /**
   * Verify a hash against the stored record.
   */
  async verifyHash(claimId: string, hashToVerify: string): Promise<boolean> {
    const record = await this.getVerification(claimId);
    if (!record) return false;
    return hashToVerify === record.verificationHash;
  }

  // ── Private ──

  /**
   * Generate a simulated transaction hash for development/testing.
   */
  private simulateTransaction(
    payload: VerificationPayload,
    evidenceHash: string,
    verificationHash: string,
  ): TransactionResult {
    // Generate a deterministic-looking tx hash from the verification hash
    const txHash = `0x${verificationHash}${Date.now().toString(16)}`;
    const blockNumber = Math.floor(Math.random() * 90000000) + 10000000;

    return {
      txHash,
      blockNumber,
      status: "success",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Submit verification data to the real blockchain via smart contract.
   * Placeholder — requires deployed contract and ethers.js signer.
   */
  private async submitToChain(
    _payload: VerificationPayload,
    _evidenceHash: string,
    _verificationHash: string,
  ): Promise<TransactionResult> {
    // Real implementation will:
    // 1. Connect to wallet (MetaMask, etc.)
    // 2. Call contract.createVerification(claimId, evidenceHash, verificationHash)
    // 3. Wait for transaction confirmation
    // 4. Return txHash and blockNumber
    throw new Error(
      "Real blockchain submission not yet configured. Use simulated mode for now.",
    );
  }
}

/** Singleton instance with default config. */
export const blockchainService = new BlockchainService({ simulated: true });
