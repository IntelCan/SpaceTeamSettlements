// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract SettlementMechanism {
    mapping(uint => Settlement) settlements;
    mapping(address => uint[]) payerSettlements;
    mapping(address => uint[]) obligationers;

    constructor(){

    }


    function addNewSettlement(SettlementDto calldata settlementDto) public returns (uint) {
        return addNewSettlement(settlementDto, msg.sender);
    }

    function addNewSettlement(SettlementDto calldata settlementDto, address payer) public returns (uint) {
        require(bytes(settlementDto.name).length > 1, "Name must not be empty");
        require(settlementDto.participants.length > 0, "Settlement participants have to exists");
        require(payer != address(0), "Payer address not defined");

        uint newSettlementId = addSettlement(settlementDto, payer);
        updatePayers(newSettlementId, payer);
        updateObligatories(newSettlementId, settlementDto.participants);

        return newSettlementId;

    }


    function confirm(uint settlementId) public {
        require(settlementId != 0, "Settlement id must not be emoty");

        Settlement storage currentSettlement = settlements[settlementId];
        ParticipantCost[] storage participants = currentSettlement.participants;
         uint confirmedCount = 0;
        for(uint j = 0; j < participants.length; j++) {
            if(participants[j].participant == msg.sender) {
               participants[j].confirmed = true;
            }

            if(participants[j].confirmed){
                confirmedCount++;
            }

        }

        bool allConfirmed = confirmedCount == participants.length;
        if(allConfirmed) {
           currentSettlement.finished = true;
        }

    }


    function getMyCurrentObligations() public view returns (Obligation[] memory) {
        uint[] memory settlmentIds = obligationers[msg.sender];
        uint idsCount = settlmentIds.length;
        Obligation[] memory obligations = new Obligation[](idsCount);
        uint obligationCount = 0;
        for(uint i = 0; i < idsCount; i++) {
            Settlement memory currentSettlement = settlements[settlmentIds[i]];
            ParticipantCost[] memory participants = currentSettlement.participants;
            ParticipantCost memory currentSettlementParticipant;
            //while loop could be more efficient but it could be unifinite loop - to consider
            for(uint j = 0; j < participants.length; j++) {
                if(participants[j].participant == msg.sender) {
                    currentSettlementParticipant = participants[j];
                }
            }

            if(!currentSettlementParticipant.confirmed) {
                Obligation memory obligation = Obligation({
                    settlmentId: settlmentIds[i],
                    settlementName: currentSettlement.name,
                    currency: currentSettlementParticipant.currency,
                    amount: currentSettlementParticipant.amount,
                    payee: currentSettlement.payer

                });
                obligations[obligationCount] = obligation;
                obligationCount++;
            }
        }
       
        if(obligationCount == 0){
            return new Obligation[](0);
        } else if (obligationCount > 0 && obligationCount != idsCount) {
            assembly { mstore(obligations, obligationCount) }
        }

        return obligations;

    }


    function getMyUnpaidSettlements() view public returns (uint[] memory) {
       return getSettlements(false);
    }

    function getMyPaidSettlements() view public returns (uint[] memory) {
        return getSettlements(true);
    }

    //define Settlement struct for gui
    function getSettlements(bool finished) view private returns (uint[] memory) {
        uint[] memory userSettlements = payerSettlements[msg.sender];
        uint userSettlementsCount = userSettlements.length;
        uint[] memory filteredSettlements = new uint[](userSettlementsCount);
        uint filteredSettlementsCount = 0;
        for(uint i = 0; i<userSettlementsCount; i++){
            Settlement memory foundSettlement = settlements[userSettlements[i]];
            if(foundSettlement.finished == finished){
                filteredSettlements[filteredSettlementsCount] = userSettlements[i];
                filteredSettlementsCount++;
            }
        }

        if(filteredSettlementsCount == 0){
            return new uint[](0);
        } else if (filteredSettlementsCount > 0 && filteredSettlementsCount != userSettlementsCount) {
            assembly { mstore(filteredSettlements, filteredSettlementsCount) }
        }

        return filteredSettlements;
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
        payerSettlements[payer].push(settlementId);
    }

    function updateObligatories(uint settlementId, ParticipantCostDto[] calldata participants) private  {
        //while loop could be more efficient but i could be unifinite loop - to consider
        for (uint j = 0; j < participants.length; j++) {
            obligationers[participants[j].participant].push(settlementId);
        }

           
    }

    struct Settlement {
        address payer;
        string name;
        uint date;
        bool finished; // maybe move to payerSettlements array ?
        ParticipantCost[] participants;
    }

    struct SettlementDto {
        string name;
        uint date;
        ParticipantCostDto[] participants;
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

    struct Obligation {
        uint settlmentId;
        string settlementName;
        bytes32 currency;
        uint amount;
        address payee;
    }

}
