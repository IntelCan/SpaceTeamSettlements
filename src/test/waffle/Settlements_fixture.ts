import {Wallet} from "@ethersproject/wallet/src.ts";
import {Contract} from "ethers";

export const PLN = '0x504c4e0000000000000000000000000000000000000000000000000000000000'

export async function twoSettlementsFromMainWalletAndTwoFromTwoOtherParticipants(wallet: Wallet, participant1Wallet: Wallet, participant2Wallet: Wallet, participant3Wallet: Wallet, contract: Contract) {
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
                participant: wallet.address,
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


export function settlementWithThreeParticipants(participant1Wallet: Wallet, participant2Wallet: Wallet, participant3Wallet: Wallet) {
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

export function settlementWithOneParticipant(participant1Wallet: Wallet) {
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