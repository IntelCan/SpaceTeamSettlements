import {expect, use} from 'chai';
import {Contract} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
// @ts-ignore
import SettlementMechanism from '../../../build/SettlementMechanism.json';

use(solidity);

describe('SettlementMechanism', () => {
    const [wallet, participant1Wallet] = new MockProvider().getWallets()
    let token: Contract

    beforeEach(async () => {
        token = await deployContract(wallet, SettlementMechanism, [], {gasLimit: 3_000_000, gasPrice: 10});
    })

    it('Returns empty array when caller gets settlements he participated in, ' +
        'but caller address was never in any settlement', async () => {
        expect(await token.getAllSettlementsIParticipatedIn()).to.be.an('array').that.is.empty
    })

    //TODO: test empty when all finished
    it('Returns empty array when caller gets his unfinished settlements, ' +
        'but caller address was never in any settlement', async () => {
        expect(await token.getMyUnfinishedSettlements()).to.be.an('array').that.is.empty
    })

    it('Reverts when participant list is empty when adding new settlement', async () => {
        const someSettlement = {
            name: 'Pizza',
            date: 123,
            participants: []
        }

        expect(await token.addNewSettlement(someSettlement)).to.throw;
       // expect(await token.addNewSettlement(someSettlement)).to.be.reverted;
    })

    it('Returns senders unfinished settlements when new settlement is freshly added', async () => {
        const someSettlement = {
            name: 'Pizza',
            date: 123,
            participants: [{
                participant: participant1Wallet.address,
                currency: '0x504c4e0000000000000000000000000000000000000000000000000000000000',
                amount: 15
            }]
        }

        await token.addNewSettlement(someSettlement)
        const result = await token.getMyUnfinishedSettlements();

        expect('addNewSettlement').to.be.calledOnContractWith(token, [someSettlement]);
        expect('getMyUnfinishedSettlements').to.be.calledOnContract(token);

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
        expect(firstParticipant.currency).to.equal('0x504c4e0000000000000000000000000000000000000000000000000000000000')
        expect(firstParticipant.amount).to.equal(15)
        expect(firstParticipant.confirmed).to.be.false
    })

})