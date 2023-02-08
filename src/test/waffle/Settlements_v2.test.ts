import {expect, use} from 'chai';
import {Contract} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
// @ts-ignore
import SettlementMechanism from '../../../build/SettlementMechanism.json';
import {
    PLN, settlementWithOneParticipant,
    settlementWithThreeParticipants,
    twoSettlementsFromMainWalletAndTwoFromTwoOtherParticipants
} from "./Settlements_fixture";

use(solidity);

describe('SettlementMechanism - adding new settlement', () => {
    const [wallet, participant1Wallet, participant2Wallet, participant3Wallet] = new MockProvider().getWallets()
    let contract: Contract

    beforeEach(async () => {
        contract = await deployContract(wallet, SettlementMechanism, []);
    })

    it('Reverts when participant list is empty when adding new settlement', async () => {
        const someSettlement = {
            name: 'Pizza',
            date: 123,
            participants: []
        }

        await expect(contract.addNewSettlement(someSettlement, {gasLimit: 5000000})).to.be.revertedWith("Settlement participants have to exist");
    })

    it('Reverts when settlement name is empty when adding new settlement', async () => {
        const someSettlement = {
            name: '',
            date: 123,
            participants: [{
                participant: participant1Wallet.address,
                currency: PLN,
                amount: 15
            }]
        }

        await expect(contract.addNewSettlement(someSettlement, {gasLimit: 5000000})).to.be.revertedWith("Name must not be empty");
    })

    it('Reverts when date is negative when adding new settlement', async () => {
        const someSettlement = {
            name: 'Pizza',
            date: -100,
            participants: [{
                participant: participant1Wallet.address,
                currency: PLN,
                amount: 15
            }]
        }

        await expect(contract.addNewSettlement(someSettlement, {gasLimit: 5000000})).to.be.reverted;
    })

    it('Reverts when passed empty object when adding new settlement', async () => {
        await expect(contract.addNewSettlement({}, {gasLimit: 5000000})).to.be.reverted;
    })

    it('Reverts when new settlement contains payer in participants list', async () => {
        const someSettlement = {
            name: 'Pizza',
            date: 100,
            participants: [{
                participant: wallet.address,
                currency: PLN,
                amount: 15
            }]
        }

        await expect(contract.addNewSettlement(someSettlement, {gasLimit: 5000000})).to.be.revertedWith("You can't be a payer and participant at the same time");
    })

    it('Returns senders unfinished settlements when new settlement is freshly added', async () => {
        const someSettlement = settlementWithOneParticipant(participant1Wallet)

        await contract.addNewSettlement(someSettlement)
        const result = await contract.getMyUnfinishedSettlements();

        expect('addNewSettlement').to.be.calledOnContractWith(contract, [someSettlement]);
        expect('getMyUnfinishedSettlements').to.be.calledOnContract(contract);

        expect(result).to.be.an('array').that.is.not.empty

        const returnedSettlementDto = result[0];
        expect(returnedSettlementDto.id).to.be.not.null
        expect(returnedSettlementDto.payer).to.equal(wallet.address)
        expect(returnedSettlementDto.name).to.equal('Pizza')
        expect(returnedSettlementDto.date).to.equal(123)
        expect(returnedSettlementDto.finished).to.be.false

        expect(returnedSettlementDto.participants).to.be.an('array').that.is.not.empty
        expect(returnedSettlementDto.participants.length).to.equal(1)

        const firstParticipant = returnedSettlementDto.participants[0];
        expect(firstParticipant.participant).to.equal(participant1Wallet.address)
        expect(firstParticipant.currency).to.equal(PLN)
        expect(firstParticipant.amount).to.equal(15)
        expect(firstParticipant.confirmed).to.be.false
    })

    it('Adds all defined participants to the settlement when creating new settlement', async () => {
        const someSettlement = settlementWithThreeParticipants(participant1Wallet, participant2Wallet, participant3Wallet)

        await contract.addNewSettlement(someSettlement)
        const result = await contract.getMyUnfinishedSettlements();

        expect(result[0].participants).to.be.an('array').that.is.not.empty
        expect(result[0].participants.length).to.equal(3)

        expect(result[0].participants[0].participant).to.equal(participant1Wallet.address)
        expect(result[0].participants[1].participant).to.equal(participant2Wallet.address)
        expect(result[0].participants[2].participant).to.equal(participant3Wallet.address)
    })

    it('Sets all participants obligations as NOT confirmed after adding new settlement', async () => {
        const someSettlement = settlementWithThreeParticipants(participant1Wallet, participant2Wallet, participant3Wallet)

        await contract.addNewSettlement(someSettlement)
        const result = await contract.getMyUnfinishedSettlements();

        expect(result[0].participants[0].confirmed).to.false
        expect(result[0].participants[1].confirmed).to.false
        expect(result[0].participants[2].confirmed).to.false
    })


})

describe('SettlementMechanism - get all settlements i participated in', () => {
    const [wallet, participant1Wallet, participant2Wallet, participant3Wallet] = new MockProvider().getWallets()
    let contract: Contract

    beforeEach(async () => {
        contract = await deployContract(wallet, SettlementMechanism, []);
    })


    it('Returns empty array when caller gets settlements he participated in, ' +
        'but caller address was never in any settlement', async () => {
        expect(await contract.getAllSettlementsIParticipatedIn()).to.be.an('array').that.is.empty
    })

    it('Returns both settlements where i am the payer and the debtor', async () => {
        //given
        const settlementWhereIAmThePayer = settlementWithThreeParticipants(participant1Wallet, participant2Wallet, participant3Wallet);
        const settlementWhereIAmADebtor = settlementWithOneParticipant(wallet);

        await contract.addNewSettlement(settlementWhereIAmThePayer);
        await contract.connect(participant3Wallet).addNewSettlement(settlementWhereIAmADebtor);

        //when
        const allSettlementsIParticipated = await contract.getAllSettlementsIParticipatedIn();

        //then
        expect(allSettlementsIParticipated.length).to.be.equal(2)
        expect(allSettlementsIParticipated[0].payer).to.be.properAddress
        expect(allSettlementsIParticipated[0].payer).to.be.equal(wallet.address)
        expect(allSettlementsIParticipated[1].participants[0].participant).to.be.properAddress
        expect(allSettlementsIParticipated[1].participants[0].participant).to.be.equal(wallet.address)
    })
})

describe('SettlementMechanism - get my unfinished settlements', () => {
    const [wallet, participant1Wallet, participant2Wallet, participant3Wallet] = new MockProvider().getWallets()
    let contract: Contract

    beforeEach(async () => {
        contract = await deployContract(wallet, SettlementMechanism, []);
    })


    it('Returns empty array when caller gets his unfinished settlements, ' +
        'but caller address was never in any settlement', async () => {
        expect(await contract.getMyUnfinishedSettlements()).to.be.an('array').that.is.empty
    })

    it('Gets unfinished settlements for contract caller', async () => {
        //given
        await twoSettlementsFromMainWalletAndTwoFromTwoOtherParticipants(wallet, participant1Wallet, participant2Wallet, participant3Wallet, contract);


        //call from main address
        //when
        const result = await contract.getMyUnfinishedSettlements();

        //then
        expect(result).to.be.an('array').that.is.not.empty
        expect(result.length).to.equal(2)


        //call from participant1 address
        //when
        const participant1result = await contract.connect(participant1Wallet).getMyUnfinishedSettlements();

        //then
        expect(participant1result).to.be.an('array').that.is.not.empty
        expect(participant1result.length).to.equal(1)


        //call from participant1 address
        //when
        const participant2result = await contract.connect(participant2Wallet).getMyUnfinishedSettlements();

        //then
        expect(participant2result).to.be.an('array').that.is.not.empty
    })

    it('Doesnt return finished settlements', async () => {
        //given
        const settlement = settlementWithThreeParticipants(participant1Wallet, participant2Wallet, participant3Wallet);
        await contract.addNewSettlement(settlement);
        let settlements = await contract.getMyUnfinishedSettlements();
        let settlementId = settlements[0].id;

        //when
        await contract.connect(participant1Wallet).confirm(settlementId, {gasLimit: 5000000})
        await contract.connect(participant2Wallet).confirm(settlementId, {gasLimit: 5000000})
        await contract.connect(participant3Wallet).confirm(settlementId, {gasLimit: 5000000})

        //then my unfinished result is empty
        const myUnfinished = await contract.getMyUnfinishedSettlements();
        expect(myUnfinished).to.be.an('array').that.is.empty
    })
})

describe('SettlementMechanism - confirming', () => {
    const [wallet, participant1Wallet, participant2Wallet, participant3Wallet] = new MockProvider().getWallets()
    let contract: Contract

    beforeEach(async () => {
        contract = await deployContract(wallet, SettlementMechanism, []);
    })


    it('Reverts when settlement cannot be found with given id', async () => {
        await expect(contract.connect(participant2Wallet).confirm(2137, {gasLimit: 5000000}))
            .to.be.revertedWith("Settlement with given id doesn't exist")
    })

    it('Reverts when settlement id is passed empty', async () => {
        await expect(contract.connect(participant2Wallet).confirm(0, {gasLimit: 5000000}))
            .to.be.revertedWith("Settlement id must not be empty")
    })

    it('Sets participants confirmed status to TRUE for given settlement', async () => {
        //given
        const settlement = settlementWithThreeParticipants(participant1Wallet, participant2Wallet, participant3Wallet);
        await contract.addNewSettlement(settlement);
        const settlements = await contract.getMyUnfinishedSettlements();
        const settlementId = settlements[0].id;
        await contract.connect(participant2Wallet).confirm(settlementId, {gasLimit: 5000000})

        //when
        const result = await contract.getMyUnfinishedSettlements();

        //then
        expect(result[0].participants[0].confirmed).to.be.false
        expect(result[0].participants[1].confirmed).to.be.true
        expect(result[0].participants[2].confirmed).to.be.false
    })

    it('Sets settlement as finished when all participants confirms their obligations', async () => {
        //given
        const settlement = settlementWithThreeParticipants(participant1Wallet, participant2Wallet, participant3Wallet);
        await contract.addNewSettlement(settlement);
        const settlements = await contract.getMyUnfinishedSettlements();
        const settlementId = settlements[0].id;

        //when
        await contract.connect(participant1Wallet).confirm(settlementId, {gasLimit: 5000000})
        await contract.connect(participant2Wallet).confirm(settlementId, {gasLimit: 5000000})
        await contract.connect(participant3Wallet).confirm(settlementId, {gasLimit: 5000000})

        //and settlement is set to finished
        const allSettlementsIParticipated = await contract.getAllSettlementsIParticipatedIn();
        expect(allSettlementsIParticipated.length).to.be.equal(1)
        expect(allSettlementsIParticipated[0].finished).to.be.true
        expect(allSettlementsIParticipated[0].participants[0].confirmed).to.be.true
        expect(allSettlementsIParticipated[0].participants[1].confirmed).to.be.true
        expect(allSettlementsIParticipated[0].participants[2].confirmed).to.be.true
    })

})
