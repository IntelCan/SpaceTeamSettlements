import {expect, use} from 'chai';
import {BigNumber, Contract} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
// @ts-ignore
import SettlementMechanism from '../../../build/SettlementMechanism.json';
import {
    PLN, settlementWithOneParticipant,
    settlementWithThreeParticipants,
    twoSettlementsFromMainWalletAndTwoFromTwoOtherParticipants
} from "./Settlements_fixture";
import {Wallet} from "@ethersproject/wallet/src.ts";

use(solidity);

describe('SettlementMechanism', () => {
    const [wallet, participant1Wallet, participant2Wallet, participant3Wallet] = new MockProvider().getWallets()
    let contract: Contract

    beforeEach(async () => {
        contract = await deployContract(wallet, SettlementMechanism, []);
    })

    it('Returns empty array when caller gets settlements he participated in, ' +
        'but caller address was never in any settlement', async () => {
        expect(await contract.getAllSettlementsIParticipatedIn()).to.be.an('array').that.is.empty
    })

    //TODO: test empty when all finished
    it('Returns empty array when caller gets his unfinished settlements, ' +
        'but caller address was never in any settlement', async () => {
        expect(await contract.getMyUnfinishedSettlements()).to.be.an('array').that.is.empty
    })

    it('Reverts when participant list is empty when adding new settlement', async () => {
        const someSettlement = {
            name: 'Pizza',
            date: 123,
            participants: []
        }

        await expect(contract.addNewSettlement(someSettlement, {gasLimit: 5000000})).to.be.reverted;
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

        await expect(contract.addNewSettlement(someSettlement, {gasLimit: 5000000})).to.be.reverted;
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

    //TODO: change those to check message
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

        await expect(contract.addNewSettlement(someSettlement, {gasLimit: 5000000})).to.be.reverted;
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

    it('Sets all participants obligations as NOT confirmed yes after adding new settlement', async () => {
        const someSettlement = settlementWithThreeParticipants(participant1Wallet, participant2Wallet, participant3Wallet)

        await contract.addNewSettlement(someSettlement)
        const result = await contract.getMyUnfinishedSettlements();

        expect(result[0].participants[0].confirmed).to.false
        expect(result[0].participants[1].confirmed).to.false
        expect(result[0].participants[2].confirmed).to.false
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
        expect(participant2result.length).to.equal(1)
    })


})

describe('SettlementMechanism - confirming', () => {
    const [wallet, participant1Wallet, participant2Wallet, participant3Wallet] = new MockProvider().getWallets()
    let contract: Contract

    beforeEach(async () => {
        contract = await deployContract(wallet, SettlementMechanism, []);
    })

    it('Sets participants confirmed status to TRUE for given settlement', async () => {
        //given
        const settlement = settlementWithThreeParticipants(participant1Wallet, participant2Wallet, participant3Wallet);
        //The return-value of a non-constant (neither pure nor view) function is available only when the function is called on-chain (i.e., from this contract or from another contract).
        //
        //When you call such function from the off-chain (e.g., from an ethers.js script), you need to execute it within a transaction, and the return-value is the hash of that transaction.
        // let  tx2 = contract.addNewSettlement(settlement).then(txResponse => {
        //     console.log(txResponse)
        //     txResponse.wait()
        //         .then(response => {
        //             resp = "dududud"
        //             console.log(response)
        //         })
        // });

        let tx = await contract.addNewSettlement(settlement);
        await tx.wait()
        console.log(tx)

        // const response = await contract.addNewSettlement(settlement);
        // console.log(response.toString())
        // const result = await contract.getMyUnfinishedSettlements();
        // console.log(result)
        //const settlementId = BigNumber.from(response._hex);
        //console.log(settlementId)

        //when
        //await contract.connect(participant1Wallet).confirm(resp.toString(), {gasLimit: 5000000})

        //then
        // const result = await contract.getMyUnfinishedSettlements();

        //then
        // expect(result[0].participants[0].confirmed).to.be.true
        // expect(result[0].participants[1].confirmed).to.be.false
        // expect(result[0].participants[2].confirmed).to.be.false

    })
})
