// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract NameService {
    mapping(address => string) names;

    function checkNameExists() public view returns (bool exists) {
        return bytes(names[msg.sender]).length != 0;
    }

    function setNewName(string calldata name) public {
        require(bytes(name).length > 0, "Name must not be empty");
        names[msg.sender] = name;
    }

    function getNamesFor(address[] calldata addresses) public view returns (AddressName[] memory) {
        AddressName[] memory result = new AddressName[](addresses.length);

        for (uint i = 0; i < addresses.length; i++) {
            result[i] = AddressName({
            addr : addresses[i],
            name : names[addresses[i]]
            });
        }

        return result;
    }

    struct AddressName {
        address addr;
        string name;
    }

}