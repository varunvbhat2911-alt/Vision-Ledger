// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VerificationLedger
 * @notice Immutable on-chain registry for VisionLedger verification records.
 * @dev Deployed on Polygon Amoy testnet.
 *
 * Each verification is stored with:
 * - claimId: UUID of the claim
 * - evidenceHash: SHA-256 of the submitted evidence
 * - verificationHash: SHA-256 combining evidence + AI result
 * - timestamp: When the record was created on-chain
 */
contract VerificationLedger {
    /// @notice Structure representing a single verification record.
    struct VerificationRecord {
        string claimId;
        bytes32 evidenceHash;
        bytes32 verificationHash;
        address submittedBy;
        uint256 timestamp;
    }

    /// @notice Mapping from claimId to its verification record.
    mapping(string => VerificationRecord) private records;

    /// @notice Array of all claim IDs for enumeration.
    string[] private allClaimIds;

    /// @notice Emitted when a new verification is recorded.
    event VerificationCreated(
        string indexed claimId,
        bytes32 evidenceHash,
        bytes32 verificationHash,
        address indexed submittedBy,
        uint256 timestamp
    );

    /**
     * @notice Create a new verification record.
     * @param claimId UUID of the claim (e.g. "550e8400-e29b-41d4-a716-446655440000")
     * @param evidenceHash SHA-256 hash of the evidence
     * @param verificationHash SHA-256 hash combining evidence + AI result
     */
    function createVerification(
        string calldata claimId,
        bytes32 evidenceHash,
        bytes32 verificationHash
    ) external {
        require(bytes(claimId).length > 0, "Claim ID required");
        require(
            bytes(records[claimId].claimId).length == 0,
            "Claim already recorded"
        );

        records[claimId] = VerificationRecord({
            claimId: claimId,
            evidenceHash: evidenceHash,
            verificationHash: verificationHash,
            submittedBy: msg.sender,
            timestamp: block.timestamp
        });

        allClaimIds.push(claimId);

        emit VerificationCreated(
            claimId,
            evidenceHash,
            verificationHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Retrieve a verification record by claim ID.
     * @param claimId The UUID of the claim.
     * @return The full verification record.
     */
    function getVerification(
        string calldata claimId
    )
        external
        view
        returns (
            string memory,
            bytes32,
            bytes32,
            address,
            uint256
        )
    {
        VerificationRecord memory record = records[claimId];
        require(bytes(record.claimId).length > 0, "Record not found");

        return (
            record.claimId,
            record.evidenceHash,
            record.verificationHash,
            record.submittedBy,
            record.timestamp
        );
    }

    /**
     * @notice Get the total number of records.
     * @return The number of verification records stored.
     */
    function getRecordCount() external view returns (uint256) {
        return allClaimIds.length;
    }

    /**
     * @notice Get all claim IDs (paginated).
     * @param start Index to start from.
     * @param limit Maximum number of IDs to return.
     * @return Array of claim IDs.
     */
    function getAllClaimIds(
        uint256 start,
        uint256 limit
    ) external view returns (string[] memory) {
        uint256 total = allClaimIds.length;
        if (start >= total) return new string[](0);

        uint256 end = start + limit;
        if (end > total) end = total;

        string[] memory ids = new string[](end - start);
        for (uint256 i = start; i < end; i++) {
            ids[i - start] = allClaimIds[i];
        }

        return ids;
    }

    /**
     * @notice Get the full history of verification records (paginated).
     * @param start Index to start from.
     * @param limit Maximum number of records to return.
     * @return Arrays of claimIds, evidenceHashes, verificationHashes, and timestamps.
     */
    function getHistory(
        uint256 start,
        uint256 limit
    )
        external
        view
        returns (
            string[] memory claimIds,
            bytes32[] memory evidenceHashes,
            bytes32[] memory verificationHashes,
            uint256[] memory timestamps
        )
    {
        uint256 total = allClaimIds.length;
        if (start >= total) {
            return (
                new string[](0),
                new bytes32[](0),
                new bytes32[](0),
                new uint256[](0)
            );
        }

        uint256 end = start + limit;
        if (end > total) end = total;
        uint256 size = end - start;

        claimIds = new string[](size);
        evidenceHashes = new bytes32[](size);
        verificationHashes = new bytes32[](size);
        timestamps = new uint256[](size);

        for (uint256 i = 0; i < size; i++) {
            VerificationRecord memory record = records[allClaimIds[start + i]];
            claimIds[i] = record.claimId;
            evidenceHashes[i] = record.evidenceHash;
            verificationHashes[i] = record.verificationHash;
            timestamps[i] = record.timestamp;
        }
    }
}
