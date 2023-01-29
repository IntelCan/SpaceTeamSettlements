import {expect, use} from 'chai';
import {Contract} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
// @ts-ignore
import NameService from '../../../build/NameService.json';

use(solidity);

describe('NameService', () => {
    const [wallet1, wallet2, wallet3] = new MockProvider().getWallets()
    let contract: Contract

    beforeEach(async () => {
        contract = await deployContract(wallet1, NameService, [])
    })

    it('should return false when name was not set for address', async () => {
        const exists = await contract.checkNameExists()

        expect(exists).to.be.equal(false, "Should not exist in fresh contract")
    });

    it('should add a name for sender address', async () => {
        await contract.setNewName("TestName")
        const exists = await contract.checkNameExists()

        expect(exists).to.be.equal(true, "Name should exist for given address")
    });

    it('should return false when other address is asking for name when name exists for other address', async () => {
        await contract.setNewName("TestName")
        const exists = await contract.connect(wallet2).checkNameExists()

        expect(exists).to.be.equal(false, "Name should not exist for given address")
    });

    it('should return names for given list of addresses', async () => {
        await contract.setNewName("TestName")
        await contract.connect(wallet2).setNewName("TestName2")
        await contract.connect(wallet3).setNewName("TestName3")
        const names = await contract.getNamesFor([
            wallet1.address,
            wallet2.address,
            wallet3.address
        ]);

        expect(names[0].name).to.be.equal("TestName", "Name should exist for given address")
        expect(names[1].name).to.be.equal("TestName2", "Name should exist for given address")
        expect(names[2].name).to.be.equal("TestName3", "Name should exist for given address")
    });

})
