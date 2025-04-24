// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FileSharing {
    struct SharedFile {
        string cid;
        address owner;
        address sharedWith;
        uint256 sharedTimestamp;
    }
    
    mapping(address => SharedFile[]) private sharedWithMe;
    mapping(address => mapping(string => address[])) private fileShares;
    
    event FileShared(address indexed owner, address indexed recipient, string cid);
    event ShareRevoked(address indexed owner, address indexed recipient, string cid);
    
    function shareFile(string memory _cid, address _recipient) public {
        require(_recipient != msg.sender, "Cannot share with yourself");
        require(_recipient != address(0), "Invalid recipient address");
        
        // Check if already shared
        address[] storage recipients = fileShares[msg.sender][_cid];
        for (uint i = 0; i < recipients.length; i++) {
            if (recipients[i] == _recipient) {
                revert("File already shared with this address");
            }
        }
        
        // Add to shared records
        recipients.push(_recipient);
        
        SharedFile memory shared = SharedFile({
            cid: _cid,
            owner: msg.sender,
            sharedWith: _recipient,
            sharedTimestamp: block.timestamp
        });
        
        sharedWithMe[_recipient].push(shared);
        
        emit FileShared(msg.sender, _recipient, _cid);
    }
    
    function revokeAccess(string memory _cid, address _recipient) public {
        address[] storage recipients = fileShares[msg.sender][_cid];
        
        for (uint i = 0; i < recipients.length; i++) {
            if (recipients[i] == _recipient) {
                // Remove by swapping with last element and reducing length
                recipients[i] = recipients[recipients.length - 1];
                recipients.pop();
                
                // Remove from shared with recipient
                removeFromSharedWithMe(_recipient, _cid);
                
                emit ShareRevoked(msg.sender, _recipient, _cid);
                return;
            }
        }
        
        revert("File not shared with this address");
    }
    
    function removeFromSharedWithMe(address _recipient, string memory _cid) internal {
        SharedFile[] storage shared = sharedWithMe[_recipient];
        
        for (uint i = 0; i < shared.length; i++) {
            if (keccak256(bytes(shared[i].cid)) == keccak256(bytes(_cid)) && 
                shared[i].owner == msg.sender) {
                shared[i] = shared[shared.length - 1];
                shared.pop();
                return;
            }
        }
    }
    
    function getFilesSharedWithMe() public view returns (SharedFile[] memory) {
        return sharedWithMe[msg.sender];
    }
    
    function hasAccess(address _user, string memory _cid) public view returns (bool) {
        SharedFile[] memory shared = sharedWithMe[_user];
        
        for (uint i = 0; i < shared.length; i++) {
            if (keccak256(bytes(shared[i].cid)) == keccak256(bytes(_cid))) {
                return true;
            }
        }
        
        return false;
    }
}