// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// These files are dynamically created at test time
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Settlements_v2.sol";

contract TestSettlementMechanism {
  SettlementMechanism public settlementMechanism;

  function beforeEach() public {
        settlementMechanism = new SettlementMechanism();
  }

  function testShouldThrowWhenSettlementNameIsEmpty() public {
      //given
    SettlementMechanism.SettlementDto memory newSettlement = createSettlement("", block.timestamp, 2);
    
      //when
    try settlementMechanism.addNewSettlement(newSettlement) {
      Assert.fail("Should throw constraint validation error");
    } catch Error (string memory _reason) {
        Assert.equal(_reason, "Name must not be empty", "Wrong error reason");
    }
  }

  function testShouldThrowWhenSettlementHasNoParticipants() public {
      //given
    SettlementMechanism.SettlementDto memory newSettlement = createSettlement("Friday pizza", block.timestamp, 0);
    
      //when
    try settlementMechanism.addNewSettlement(newSettlement) {
      Assert.fail("Should throw constraint validation errror");
    } catch Error (string memory _reason) {
        Assert.equal(_reason, "Settlement participants have to exists", "Wrong error reason");
    }
  }

  function testShouldThrowWhenSettlementDateIsNegative() public {
      //given
    SettlementMechanism.SettlementDto memory newSettlement = createSettlement("Friday pizza", 0, 2);
    
      //when
    try settlementMechanism.addNewSettlement(newSettlement) {
      Assert.fail("Should throw constraint validation errror");
    } catch Error (string memory _reason) {
        Assert.equal(_reason, "Date cannot be negative", "Wrong error reason");
    }
  }

  function testShouldThrowWhenNewSettlementHasPayerAsAParticipant() public {
      //given
    SettlementMechanism.SettlementDto memory newSettlement = createSettlementWithPayerAsAParticipant("Friday pizza", block.timestamp);
    
      //when
    try settlementMechanism.addNewSettlement(newSettlement) {
      Assert.fail("Should throw constraint validation errror");
    } catch Error (string memory _reason) {
        Assert.equal(_reason, "You can't be a payer and participant at the same time", "Wrong error reason");
    }
  }

  function testShouldThrowWhenSettlementIdToConfirmIsEmpty() public {
      //given empty settlementId
    uint settlementId;
    
      //when
    try settlementMechanism.confirm(settlementId) {
      Assert.fail("Should throw constraint validation errror");
    } catch Error (string memory _reason) {
        Assert.equal(_reason, "Settlement id must not be empty", "Wrong error reason");
    }
  }

  function testShouldThrowWhenSettlementToConfirmWithGivenIdDoesntExist() public {
      //given empty settlementId
    uint settlementId = uint(keccak256(abi.encodePacked(block.timestamp, address(this))));
    
      //when
    try settlementMechanism.confirm(settlementId) {
      Assert.fail("Should throw constraint validation errror");
    } catch Error (string memory _reason) {
        Assert.equal(_reason, "Settlement with given id not exists", "Wrong error reason");
    }
  }
  
  function createSettlement(string memory _name, uint _date, uint participantCount) private pure returns (SettlementMechanism.SettlementDto memory) {
    uint initialAmount = 100;
    SettlementMechanism.ParticipantCostDto[] memory settlementParticipants = new SettlementMechanism.ParticipantCostDto[](participantCount);
    for(uint i = 1; i<= participantCount; i++){
      settlementParticipants[i-1] = SettlementMechanism.ParticipantCostDto({
        participant: address(bytes20(sha256(abi.encodePacked(i, _date)))),
        currency: 0x504c4e0000000000000000000000000000000000000000000000000000000000,
        amount: 100
      });
      initialAmount += 50;
    }

    return SettlementMechanism.SettlementDto({
      name: _name,
      date: _date,
      participants: settlementParticipants
    });
  }

  function createSettlementWithPayerAsAParticipant(string memory _name, uint _date) private view returns (SettlementMechanism.SettlementDto memory) {
    SettlementMechanism.ParticipantCostDto[] memory settlementParticipants = new SettlementMechanism.ParticipantCostDto[](2);
    settlementParticipants[0] = SettlementMechanism.ParticipantCostDto({
        participant: address(1),
        currency: 0x504c4e0000000000000000000000000000000000000000000000000000000000,
        amount: 100
      });
    settlementParticipants[1] = SettlementMechanism.ParticipantCostDto({
        participant: address(this),
        currency: 0x504c4e0000000000000000000000000000000000000000000000000000000000,
        amount: 100
      });  
    return SettlementMechanism.SettlementDto({
      name: _name,
      date: _date,
      participants: settlementParticipants
   });    
  }

}
