import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { Address } from 'hardhat-deploy/types';
import { NameService } from '../../typechain-types';


describe('NameService', () => {
    let contract: NameService
    let deployer: Address 
    let user1: SignerWithAddress, user2: SignerWithAddress

    beforeEach(async () => {
      deployer = (await getNamedAccounts()).deployer
      const accounts = await ethers.getSigners()
      user1 = accounts[1]
      user2 = accounts[2]
      await deployments.fixture()
      contract = await ethers.getContract("NameService", deployer)
    })

    it('Returns false when name was not set for address', async () => {
        const exists = await contract.checkNameExists()

        expect(exists).to.be.equal(false, "Should not exist in fresh contract")
    });

    it('Adds a name for sender address', async () => {
        await contract.setNewName("TestName")
        const exists = await contract.checkNameExists()

        expect(exists).to.be.equal(true, "Name should exist for given address")
    });

    it('Returns false when new address is checking if his name exists, when there are some names set for other addresses', async () => {
        await contract.setNewName("TestName")
        const exists = await contract.connect(user1).checkNameExists()

        expect(exists).to.be.equal(false, "Name should not exist for given address")
    });

    it('Returns names for given list of addresses', async () => {
        await contract.setNewName("TestName")
        await contract.connect(user1).setNewName("TestName2")
        await contract.connect(user2).setNewName("TestName3")
        const names = await contract.getNamesFor([
            deployer,
            user1.address,
            user2.address
        ]);

        expect(names[0].name).to.be.equal("TestName", "Name should exist for given address")
        expect(names[1].name).to.be.equal("TestName2", "Name should exist for given address")
        expect(names[2].name).to.be.equal("TestName3", "Name should exist for given address")
    });

})
