// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zk-kit/incremental-merkle-tree.sol/IncrementalBinaryTree.sol";

contract CredentialsDB is Ownable {
    event CredentialSavedInRegister(uint32 credentialNo);
    event LeafInserted(uint256 leaf, uint256 root);

    string public credentialsSchema;
    bool public credentialsSchemaSet = false;
    address public verifier;

    //Merkle Tree
    using IncrementalBinaryTree for IncrementalTreeData;
    IncrementalTreeData public tree;
    uint32 public constant TREE_DEPTH = 16;
    uint256[] public leavesArray;

    string[] public credentialsRegister;
    uint32 public credentialsCounter = 0;

    constructor(address _verifier) {
        tree.init(TREE_DEPTH, 0);
        verifier = _verifier;
    }

    function setCredentialsSchema(string memory schema) external onlyOwner {
        require(!credentialsSchemaSet, "Schema already set");
        credentialsSchema = schema;
        credentialsSchemaSet = true;
    }

    function saveCredential(
        string calldata data,
        uint256 leaf
    ) external onlyOwner {
        credentialsRegister.push(data);
        tree.insert(leaf);
        leavesArray.push(leaf);
        credentialsCounter++;

        emit LeafInserted(leaf, tree.root);
        emit CredentialSavedInRegister(credentialsCounter);
    }

    function viewArray(uint i) external view returns (string memory) {
        return credentialsRegister[i];
    }

    function getLeavesArray() external view returns (uint256[] memory) {
        return leavesArray;
    }

    function getMerkleRoot() external view returns (uint256) {
        return tree.root;
    }
}

