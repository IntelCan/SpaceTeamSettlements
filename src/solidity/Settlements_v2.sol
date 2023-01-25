// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//TODO: limit amount of returns elements in view functions
contract SettlementMechanism {
    mapping(uint => Settlement) settlements;
    mapping(address => uint[]) payerSettlementIds;
    mapping(address => uint[]) obligationerSettlementIds;

    constructor(){}


    function addNewSettlement(SettlementDto calldata settlementDto) public returns (uint) {
        return addNewSettlement(settlementDto, msg.sender);
    }

 
    function confirm(uint settlementId) public {
        require(settlementId != 0, "Settlement id must not be empty");

        Settlement storage currentSettlement = settlements[settlementId];
        require(currentSettlement.date != 0, "Settlement with given id doesn't exist");

        ParticipantCost[] storage participants = currentSettlement.participants;

        uint confirmedCount = 0;
        for(uint j = 0; j < participants.length; j++) {
            if(participants[j].participant == msg.sender) {
               participants[j].confirmed = true;
            }
            
            //count all confirmed participants
            if(participants[j].confirmed){
                confirmedCount++;
            }

        }

        bool allConfirmed = confirmedCount == participants.length;
        if(allConfirmed) {
           currentSettlement.finished = true;
        }

    }


    function getAllSettlementsIParticipatedIn() public view returns (SettlementDetailsDto[] memory) {
        SettlementDetailsDto[] memory payerSettlements = getAllSettlementsWhereIWasAPayer();
        SettlementDetailsDto[] memory obligationerSettlements = getAllSettlementsWhereIOwedSomeone();

        return merge(payerSettlements, obligationerSettlements);
    }


    function getMyUnfinishedSettlements() view public returns (SettlementDetailsDto[] memory) {
        return getMySettlements(false);
    }

    function addNewSettlement(SettlementDto calldata settlementDto, address payer) private returns (uint) {
        require(bytes(settlementDto.name).length > 1, "Name must not be empty");
        require(settlementDto.participants.length > 0, "Settlement participants have to exist");
        require(payer != address(0), "Payer address not defined");
        require(settlementDto.date > 0, "Date cannot be negative");

        //TODO: revert if updateObligatories finished with error (transactonal)
        uint newSettlementId = addSettlement(settlementDto, payer);
        updatePayers(newSettlementId, payer);
        updateObligatories(newSettlementId, settlementDto.participants);

        return newSettlementId;

    }


    function getMySettlements(bool finished) view private returns (SettlementDetailsDto[] memory) {
        uint[] memory userSettlements = payerSettlementIds[msg.sender];
        uint userSettlementsCount = userSettlements.length;
        SettlementDetailsDto[] memory filteredSettlements = new SettlementDetailsDto[](userSettlementsCount);
        uint filteredSettlementsCount = 0;
        for(uint i = 0; i<userSettlementsCount; i++){
            Settlement memory foundSettlement = settlements[userSettlements[i]];
            if(foundSettlement.finished == finished){
                filteredSettlements[filteredSettlementsCount] = mapToDetailsDto(userSettlements[i], foundSettlement);
                filteredSettlementsCount++;
            }
        }

        if(filteredSettlementsCount == 0){
            return new SettlementDetailsDto[](0);
        } else if (filteredSettlementsCount > 0 && filteredSettlementsCount != userSettlementsCount) {
            assembly { mstore(filteredSettlements, filteredSettlementsCount) }
        }

        return filteredSettlements;
     }
    
    function getAllSettlementsWhereIOwedSomeone() view private returns (SettlementDetailsDto[] memory) {
        return mapToDetailsDtos(obligationerSettlementIds[msg.sender]);
     }

    function getAllSettlementsWhereIWasAPayer() view private returns (SettlementDetailsDto[] memory) {
        return mapToDetailsDtos(payerSettlementIds[msg.sender]);
     }

    function mapToDetailsDtos(uint[] memory settlementsId) view private returns (SettlementDetailsDto[] memory) {
        uint userSettlementsCount = settlementsId.length;
        SettlementDetailsDto[] memory filteredSettlements = new SettlementDetailsDto[](userSettlementsCount);
        for(uint i = 0; i<userSettlementsCount; i++){
            Settlement memory foundSettlement = settlements[settlementsId[i]];
            filteredSettlements[i] = mapToDetailsDto(settlementsId[i], foundSettlement);
        }

        return filteredSettlements;
    }

    function mapToDetailsDto(uint settlementId, Settlement memory settlement) pure private returns (SettlementDetailsDto memory) {
        return SettlementDetailsDto({
                    id: settlementId,
                    payer: settlement.payer,
                    name: settlement.name,
                    date: settlement.date,
                    finished: settlement.finished,
                    participants: settlement.participants
                });
     }

    function addSettlement(SettlementDto calldata settlementDto, address _payer) private returns (uint) {
        uint settlementId = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        Settlement storage newSettlement = settlements[settlementId];

        newSettlement.payer = _payer;
        newSettlement.name = settlementDto.name;
        newSettlement.date = settlementDto.date;
        newSettlement.finished = false;
        for (uint z = 0; z < settlementDto.participants.length; z++) {
            ParticipantCostDto calldata partCostLoc = settlementDto.participants[z];
            require(partCostLoc.participant != _payer, "You can't be a payer and participant at the same time");
            ParticipantCost memory mapped = ParticipantCost({
                participant: partCostLoc.participant,
                currency: partCostLoc.currency,
                amount: partCostLoc.amount,
                confirmed: false
            });
            newSettlement.participants.push(mapped);
        }

        return settlementId;
    }

    function updatePayers(uint settlementId, address payer) private {
        payerSettlementIds[payer].push(settlementId);
    }

    function updateObligatories(uint settlementId, ParticipantCostDto[] calldata participants) private  {
        for (uint j = 0; j < participants.length; j++) {
            obligationerSettlementIds[participants[j].participant].push(settlementId);
        }

           
    }
    
    //srlsy ? why there is no merge array function in solidity ???
    function merge(SettlementDetailsDto[] memory array1, SettlementDetailsDto[] memory array2) pure private returns (SettlementDetailsDto[] memory) {
        SettlementDetailsDto[] memory merged = new SettlementDetailsDto[](array1.length + array2.length);
        uint mainCounter = 0;
        while(mainCounter < array1.length) {
            merged[mainCounter] = array1[mainCounter];
            mainCounter++;
        }

        uint array2Counter = 0;
        while(array2Counter < array2.length) {
            merged[mainCounter] = array2[array2Counter];
            mainCounter++;
            array2Counter++; 
        }

        return merged;    
    }

    struct Settlement {
        address payer;
        string name;
        uint date;
        bool finished;
        ParticipantCost[] participants; //TODO: consider if it should not call this debtors ? 
    }

    struct SettlementDto {
        string name;
        uint date;
        ParticipantCostDto[] participants;
    }

    struct SettlementDetailsDto {
        uint id;
        address payer;
        string name;
        uint date;
        bool finished;
        ParticipantCost[] participants;
    }

    struct ParticipantCost {
        address participant;
        bytes32 currency;
        uint amount;
        bool confirmed;
    }

    struct ParticipantCostDto {
        address participant;
        bytes32 currency;
        uint amount;
    }
}

