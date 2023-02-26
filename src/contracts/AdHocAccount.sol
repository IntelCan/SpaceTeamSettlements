// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract AdHocAccount {
    mapping(string => Account) accounts;

    function registerNewAccount(
        string memory login,
        string memory password,
        string memory privateKey
    ) public {
        require(bytes(login).length > 0, "Login must not be empty");
        require(
            accounts[login].publicKey == address(0x0),
            "Account with that login exists"
        );
        require(bytes(password).length > 0, "Password must not be empty");
        require(
            keccak256(abi.encodePacked(privateKey)) !=
                keccak256(abi.encodePacked("0x0")),
            "Wrong private key"
        );
        require(msg.sender != address(0x0), "Wrong public key");

        accounts[login] = Account(login, password, privateKey, msg.sender);
    }

    function getAccount(
        string calldata login,
        string calldata password
    ) public view returns (AccountDto memory) {
        Account memory account = accounts[login];
        require(
            keccak256(abi.encodePacked(account.password)) ==
                keccak256(abi.encodePacked(password)),
            "Wrong credentials"
        );
        return AccountDto(account.privateKey, account.publicKey);
    }

    struct Account {
        string login;
        string password;
        string privateKey;
        address publicKey;
    }

    struct AccountDto {
        string privateKey;
        address publicKey;
    }
}
