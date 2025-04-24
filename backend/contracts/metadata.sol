// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FileMetadataStorage {
    struct FileMetadata {
        string cid;
        string name;
        uint256 size;
        string fileType;
        uint256 timestamp;
        address owner;
    }
    
    mapping(address => FileMetadata[]) private userFiles;
    mapping(string => FileMetadata) private cidToMetadata;
    
    event FileStored(address indexed owner, string cid, string name);
    
    function storeFile(string memory _cid, string memory _name, uint256 _size, string memory _fileType) public {
        FileMetadata memory newFile = FileMetadata({
            cid: _cid,
            name: _name,
            size: _size,
            fileType: _fileType,
            timestamp: block.timestamp,
            owner: msg.sender
        });
        
        userFiles[msg.sender].push(newFile);
        cidToMetadata[_cid] = newFile;
        
        emit FileStored(msg.sender, _cid, _name);
    }
    
    function getUserFiles() public view returns (FileMetadata[] memory) {
        return userFiles[msg.sender];
    }
    
    function getFileMetadata(string memory _cid) public view returns (FileMetadata memory) {
        return cidToMetadata[_cid];
    }
}