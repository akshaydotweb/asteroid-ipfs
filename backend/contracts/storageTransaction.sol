// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract StoragePayment {
    uint256 public pricePerKB = 0.00000001 ether; // Changed from pricePerKB
    uint256 public minPayment = 0.000000000001 ether; // Reduced minimum payment
    address public owner;
    
    struct StorageAllocation {
        uint256 spaceAvailable;  // in KB 
        uint256 spaceUsed;       // in KB 
        uint256 validUntil;      // timestamp
    }
    
    mapping(address => StorageAllocation) public userStorage;
    
    event StoragePurchased(address indexed user, uint256 amount, uint256 space);
    event StorageUsed(address indexed user, uint256 fileSize);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function setPricePerKB(uint256 _price) public onlyOwner {
        pricePerKB = _price;
    }
    
    function setMinPayment(uint256 _min) public onlyOwner {
        minPayment = _min;
    }
    
    function purchaseStorage() public payable {
        require(msg.value >= minPayment, "Payment too low");
        
        uint256 spaceInKB = msg.value / pricePerKB;
        
        StorageAllocation storage allocation = userStorage[msg.sender];
        allocation.spaceAvailable += spaceInKB;
        
        // Extend validity period
        uint256 newValidity = block.timestamp + 30 days;
        if (allocation.validUntil < block.timestamp) {
            allocation.validUntil = newValidity;
        } else {
            allocation.validUntil += 30 days;
        }
        
        emit StoragePurchased(msg.sender, msg.value, spaceInKB);
    }
    
    function useStorage(uint256 fileSizeInKB) public {
        StorageAllocation storage allocation = userStorage[msg.sender];
        
        require(block.timestamp <= allocation.validUntil, "Storage plan expired");
        require(allocation.spaceAvailable >= fileSizeInKB, "Not enough storage space");
        
        allocation.spaceAvailable -= fileSizeInKB;
        allocation.spaceUsed += fileSizeInKB;
        
        emit StorageUsed(msg.sender, fileSizeInKB);
    }
    
    function withdrawFunds() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    function getRemainingStorage(address user) public view returns (uint256 space, uint256 validUntil) {
        StorageAllocation memory allocation = userStorage[user];
        return (allocation.spaceAvailable, allocation.validUntil);
    }
    
    function isStorageValid(address user) public view returns (bool) {
        return block.timestamp <= userStorage[user].validUntil && 
               userStorage[user].spaceAvailable > 0;
    }
}