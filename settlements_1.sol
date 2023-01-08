// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract SpaceteamV1  {

    string[] private activeSettlementsIds;
    mapping (string => Settlement) private activeSettlements;

    //pomysl - jebać finished
    string[] private finishedSettlementsIds;
    mapping (string => Settlement) private finishedSettlements;

    function addSettlement(Settlement calldata settlement) public {
        require(bytes(settlement.id).length > 0, "Id cannot be empty");
        require(bytes(settlement.name).length > 0, "Name cannot be empty");
        require(settlement.date > 0, "Date cannot be negative");
        require(settlement.participants.length > 0, "Participants cannot be empty");

        activeSettlementsIds.push(settlement.id);
        activeSettlements[settlement.id] = settlement;
        validateNewSettlement(settlement.id);
    }

    function validateNewSettlement(string memory settlementId) private {
        for (uint i = 0 ; i < activeSettlements[settlementId].participants.length ; i++) {
            activeSettlements[settlementId].participants[i].confirmed = false;
        }
    }

    function getActiveSettlements() view public returns (Settlement[] memory settlements) {
        Settlement[] memory settlementsToReturn = new Settlement[](activeSettlementsIds.length);
        for (uint i = 0 ; i < activeSettlementsIds.length; i++) {
            string memory settlementId = activeSettlementsIds[i];
            settlementsToReturn[i] = (activeSettlements[settlementId]);
        }

        return settlementsToReturn;
    }

    function getMyUnpaidSettlements() view public returns (Settlement[] memory settlements) {
        uint arrayLength = 0;
        for (uint i = 0 ; i < activeSettlementsIds.length; i++) {
            string memory settlementId = activeSettlementsIds[i];
            Settlement memory settlement = activeSettlements[settlementId];
            if (settlement.creatorAddress == msg.sender) {
                arrayLength++;
            }
        }

        Settlement[] memory settlementsToReturn = new Settlement[](arrayLength);
        for (uint i = 0 ; i < activeSettlementsIds.length; i++) {
            string memory settlementId = activeSettlementsIds[i];
            Settlement memory settlement = activeSettlements[settlementId];
            if (settlement.creatorAddress == msg.sender) {
                settlementsToReturn[i] = settlement;
            }
        }

        return settlementsToReturn;
    }

    function getFinishedSettlements() view public returns (Settlement[] memory settlements) {
        Settlement[] memory settlementsToReturn = new Settlement[](finishedSettlementsIds.length);
        for (uint i = 0 ; i < finishedSettlementsIds.length; i++) {
            string memory settlementId = finishedSettlementsIds[i];
            settlementsToReturn[i] = (finishedSettlements[settlementId]);
        }

        return settlementsToReturn;
    }

    function getMyPaidSettlements() view public returns (Settlement[] memory settlements) {
        uint arrayLength = 0;
        for (uint i = 0 ; i < finishedSettlementsIds.length; i++) {
            string memory settlementId = finishedSettlementsIds[i];
            Settlement memory settlement = finishedSettlements[settlementId];
            if (settlement.creatorAddress == msg.sender) {
                arrayLength++;
            }
        }

        Settlement[] memory settlementsToReturn = new Settlement[](arrayLength);
        for (uint i = 0 ; i < finishedSettlementsIds.length; i++) {
            string memory settlementId = finishedSettlementsIds[i];
            Settlement memory settlement = finishedSettlements[settlementId];
            if (settlement.creatorAddress == msg.sender) {
                settlementsToReturn[i] = settlement;
            }
        }

        return settlementsToReturn;
    }

    // kurwa mac
    function getMyObligations() view public returns (Obligation[] memory obligations) {
        uint arrayLength = 0;
        
        for (uint i = 0 ; i < activeSettlementsIds.length; i++) {
            string memory settlementId = activeSettlementsIds[i];
            ParticipantCost[] memory participants = activeSettlements[settlementId].participants;
            
            for (uint i = 0; i < participants.length; i++) {
                if (participants[i].participantAddress == msg.sender && !participants[i].confirmed) {
                    arrayLength++;
                }
            }
        }

        Obligation[] memory obligationsToReturn = new Obligation[](arrayLength);
        uint resultArrayIndex = 0;

        for (uint i = 0 ; i < activeSettlementsIds.length; i++) {
            string memory settlementId = activeSettlementsIds[i];
            ParticipantCost[] memory participants = activeSettlements[settlementId].participants;
            
            for (uint i = 0; i < participants.length; i++) {
                if (participants[i].participantAddress == msg.sender && !participants[i].confirmed) {
                    obligationsToReturn[resultArrayIndex] = Obligation(
                        settlementId,
                        activeSettlements[settlementId].name,
                        participants[i].currency,
                        participants[i].amount,
                        activeSettlements[settlementId].creatorAddress);
                    resultArrayIndex++;
                }
            }
        }

        return obligationsToReturn;
    }

    function confirm(string memory settlementId) public {
        Settlement storage settlement = activeSettlements[settlementId];
        require(bytes(settlement.id).length > 0, "Settlement not found");
        
        bool participantMatched = false;

        uint participantsLength = settlement.participants.length;
        for (uint i = 0 ; i < participantsLength ; i++) {
            ParticipantCost memory participantCost = settlement.participants[i];
            if (participantCost.participantAddress == msg.sender) {
                require(!participantCost.confirmed, "Your cost is already confirmed");
                activeSettlements[settlementId].participants[i].confirmed = true;
                participantMatched = true;
                break;
            }
        }

        if (!participantMatched) {
            revert("You Are not in this settlement");
        }

        if (allParticipantsHadConfirmedCosts(settlement)) {
            moveFromActiveToFinished(settlement);
        }
    }

    function allParticipantsHadConfirmedCosts(Settlement memory settlement) private pure returns (bool settlementIsDone) {
        uint participantsLength = settlement.participants.length;
        for (uint i = 0 ; i < participantsLength ; i++) {
            ParticipantCost memory participantCost = settlement.participants[i];
            if (!participantCost.confirmed) {
                return false;
            }
        }

        return true;
    }

    

    function moveFromActiveToFinished(Settlement storage settlement) private {
            finishedSettlements[settlement.id] = settlement;
            finishedSettlementsIds.push(settlement.id);
            removeActiveSettlement(settlement.id);
    }

    struct Settlement {
        address creatorAddress;
        string id;
        string name;
        uint date;
        ParticipantCost[] participants;
    }

    struct ParticipantCost {
        address participantAddress;
        string currency;
        uint amount;
        bool confirmed;
    }

    struct Obligation {
        string settlementId;
        string settlementName;
        string currency;
        uint amount;
        address payee;
    }

    //utils xD
    function removeActiveSettlement(string memory settlementIdToRemove) private {

        int index = -1;
        for (uint i =0; i < activeSettlementsIds.length; i++) {
            string memory id = activeSettlementsIds[i];
            if (keccak256(bytes(id)) == keccak256(bytes(settlementIdToRemove))) {
                index = int(i);
            }
        }
        require(index >= 0, "Could not find settlement by Id");

        for (uint i = uint(index); i < activeSettlementsIds.length - 1; i++) {
            activeSettlementsIds[i] = activeSettlementsIds[i + 1];
        }
        activeSettlementsIds.pop();
        delete activeSettlements[settlementIdToRemove];
    }

}


// ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", "uuid1", "pizza u kondzia", 17312313, [
//     [0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2,
//             "PLN",
//             1200,
//             false], 
//     [0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db,
//              "PLN",
//              2800,
//              false]
// ]]
// {
// 	"0": "tuple(string,string,uint256,tuple(address,string,uint256,bool)[])[]: settlements uuid1,pizza u kondzia,17312313,0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db,PLN,1200,false,0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7,PLN,2800,false"
// }
