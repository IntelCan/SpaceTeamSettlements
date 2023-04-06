import {Wallet} from "@ethersproject/wallet/src.ts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";
import { Address } from "hardhat-deploy/types";
import { SettlementMechanism } from "../../typechain-types";

export const PLN = '0x504c4e0000000000000000000000000000000000000000000000000000000000'

export async function twoSettlementsFromMainWalletAndTwoFromTwoOtherParticipants(wallet: Address, participant1Wallet: SignerWithAddress, participant2Wallet: SignerWithAddress, participant3Wallet: SignerWithAddress, contract: SettlementMechanism) {
    const address1Settlement1 = {
        name: 'Pizza',
        date: 123,
        participants: [
            {
                participant: participant1Wallet.address,
                currency: PLN,
                amount: 15
            }]
    }

    const address1Settlement2 = {
        name: 'Pizza2',
        date: 125,
        participants: [
            {
                participant: participant3Wallet.address,
                currency: PLN,
                amount: 35
            },
            {
                participant: participant2Wallet.address,
                currency: PLN,
                amount: 35
            }]
    }

    const address2Settlement1 = {
        name: 'Curry',
        date: 126,
        participants: [
            {
                participant: wallet,
                currency: PLN,
                amount: 35
            }]
    }

    const address3Settlement1 = {
        name: 'Pad Thai evening',
        date: 127,
        participants: [
            {
                participant: participant3Wallet.address,
                currency: PLN,
                amount: 35
            },
            {
                participant: participant1Wallet.address,
                currency: PLN,
                amount: 35
            }]
    }

    await contract.addNewSettlement(address1Settlement1)
    await contract.addNewSettlement(address1Settlement2)
    await contract.connect(participant1Wallet).addNewSettlement(address2Settlement1)
    await contract.connect(participant2Wallet).addNewSettlement(address3Settlement1)
}


export function settlementWithThreeParticipants(participant1Wallet: SignerWithAddress, participant2Wallet: SignerWithAddress, participant3Wallet: SignerWithAddress) {
    return {
        name: 'Pizza',
        date: 123,
        participants: [
            {
                participant: participant1Wallet.address,
                currency: PLN,
                amount: 15
            },
            {
                participant: participant2Wallet.address,
                currency: PLN,
                amount: 50
            },
            {
                participant: participant3Wallet.address,
                currency: PLN,
                amount: 35
            }]
    };
}

export function settlementWithOneParticipant(participant1Wallet: SignerWithAddress) {
    return {
        name: 'Pizza',
        date: 123,
        participants: [{
            participant: participant1Wallet.address,
            currency: PLN,
            amount: 15
        }]
    };
}

export function settlementWithOneParticipantFromAddress(wallet: Address) {
    return {
        name: 'Pizza',
        date: 123,
        participants: [{
            participant: wallet,
            currency: PLN,
            amount: 15
        }]
    };
}