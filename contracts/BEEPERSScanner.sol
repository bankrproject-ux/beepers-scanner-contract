// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount)
        external
        returns (bool);
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract BEEPERSScanner {
    // ============================================================
    // CONSTANTS
    // ============================================================

    address public constant BEEPERS_NFT =
        0xAA4C702152894AddF49E2644147d2B7eA389f8Ad;

    address public constant NVDA_TOKEN =
        0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC;

    // ============================================================
    // STATE
    // ============================================================

    address public owner;

    // tokenId => has already won
    mapping(uint256 => bool) public hasWon;

    // ============================================================
    // EVENTS
    // ============================================================

    event SignalDetected(
        address indexed winner,
        uint256 indexed tokenId,
        uint256 reward
    );

    event NoSignal(
        address indexed scanner,
        uint256 indexed tokenId
    );

    event EmergencyWithdraw(
        address indexed owner,
        uint256 amount
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // ============================================================
    // MODIFIERS
    // ============================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor() {
        owner = msg.sender;
    }

    // ============================================================
    // SCAN
    // ============================================================

    /**
     * @notice Scan a BEEPERS NFT for a signal.
     *
     * Rules:
     * - Caller must currently own the selected NFT.
     * - Each tokenId can only win once.
     * - If NVDA pool has balance, caller wins ALL NVDA.
     * - If pool is empty, scan returns successfully with no reward.
     */
    function scan(uint256 tokenId) external {
        // Verify caller owns this BEEPERS NFT
        require(
            IERC721(BEEPERS_NFT).ownerOf(tokenId) == msg.sender,
            "You do not own this BEEPER"
        );

        // A BEEPER that already won can never win again
        require(
            !hasWon[tokenId],
            "This BEEPER already detected a signal"
        );

        uint256 poolBalance =
            IERC20(NVDA_TOKEN).balanceOf(address(this));

        // No signal — pool is empty
        if (poolBalance == 0) {
            emit NoSignal(msg.sender, tokenId);
            return;
        }

        // IMPORTANT:
        // Mark as won BEFORE transfer.
        // This protects against reentrancy/race conditions.
        hasWon[tokenId] = true;

        // Winner takes entire pool
        bool success =
            IERC20(NVDA_TOKEN).transfer(
                msg.sender,
                poolBalance
            );

        require(success, "NVDA transfer failed");

        emit SignalDetected(
            msg.sender,
            tokenId,
            poolBalance
        );
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    function getPoolBalance()
        external
        view
        returns (uint256)
    {
        return IERC20(NVDA_TOKEN).balanceOf(address(this));
    }

    function isEligible(uint256 tokenId)
        external
        view
        returns (bool)
    {
        return !hasWon[tokenId];
    }

    // ============================================================
    // OWNER EMERGENCY WITHDRAW
    // ============================================================

    /**
     * @notice Withdraw NVDA from the reward pool.
     * Owner can withdraw any amount up to the contract balance.
     */
    function emergencyWithdraw(uint256 amount)
        external
        onlyOwner
    {
        uint256 balance =
            IERC20(NVDA_TOKEN).balanceOf(address(this));

        require(amount > 0, "Amount must be greater than zero");
        require(amount <= balance, "Insufficient pool balance");

        bool success =
            IERC20(NVDA_TOKEN).transfer(
                owner,
                amount
            );

        require(success, "Withdraw failed");

        emit EmergencyWithdraw(owner, amount);
    }

    // ============================================================
    // OWNER MANAGEMENT
    // ============================================================

    function transferOwnership(address newOwner)
        external
        onlyOwner
    {
        require(
            newOwner != address(0),
            "Invalid owner"
        );

        emit OwnershipTransferred(owner, newOwner);

        owner = newOwner;
    }
}
