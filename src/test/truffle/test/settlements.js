const SettlementMechanism = artifacts.require("SettlementMechanism");

contract('SettlementMechanism', (accounts) => {
  it('should add new settlement and finish by all participants', async () => {
      //given 3 accounts.
    const accountOne = accounts[0];
    const accountTwo = accounts[1];
    const accountThree = accounts[2];

    const currency = '0x504c4e0000000000000000000000000000000000000000000000000000000000';
    const newSetttlement = {
      'name': 'First pizza with truffles',
      'date': 1674410081,
      'participants': [{'participant': accountTwo, 'currency': currency, 'amount': 100}, {'participant': accountThree, 'currency': currency, 'amount': 150}]
    }
    const settlementMechanismInstance = await SettlementMechanism.deployed();

      //when 
    const newSetttlementId = await settlementMechanismInstance.addNewSettlement(newSetttlement);
      //check if new settlement has been added 
    assert.equal(1, (await settlementMechanismInstance.getMyUnfinishedSettlements({from: accountOne})).length, "Account don't have new settlement");
  
      //confirm obligation by account two 
    const accountTwoObligations = await settlementMechanismInstance.getAllSettlementsIParticipatedIn({from: accountTwo});
    await settlementMechanismInstance.confirm(accountTwoObligations[0].id, {from: accountTwo});

      //confirm obligation by account three 
    const accountThreeObligations = await settlementMechanismInstance.getAllSettlementsIParticipatedIn({from: accountThree});
    await settlementMechanismInstance.confirm(accountThreeObligations[0].id, {from: accountThree});

      //then check settlement data in contract storage
    const accountTwoObligationsAfterConfirm = await settlementMechanismInstance.getAllSettlementsIParticipatedIn({from: accountTwo});
    const accountThreeObligationsAfterConfirm = await settlementMechanismInstance.getAllSettlementsIParticipatedIn({from: accountThree});
    assert.equal(true, accountTwoObligationsAfterConfirm[0].participants[0].confirmed, "Obligation of account two should be confirmed");
    assert.equal(true, accountThreeObligationsAfterConfirm[0].participants[1].confirmed, "Obligation of account three should be confirmed");
    assert.equal(0, (await settlementMechanismInstance.getMyUnfinishedSettlements({from: accountOne})).length, "Account shouldn't have unfinished settlements");
    assert.equal(1, (await settlementMechanismInstance.getAllSettlementsIParticipatedIn({from: accountOne})).length, "Owner should have settlement in which participated");
  });
});

