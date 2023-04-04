//TODO: for local developement
const myAddress = "0x1B1280269816666239b53FeeEeD82a88151Cb19E";
const address2 = "0x9ec0393370d0861A29e08C48bACaa4C2E3f4adb9";
const address3 = "0xbC7747aF3E3A1c308A3219852cf9675f847009f9";
const address4 = "0xC9C912f55bCdA3B36C2089C0984377400C945849";
const settlementsContractAddress = "0xd763CF5661D3E037EEa36e6EEEC6CFeB211e4254";

function getAllSettlementsIParticipatedIn() {
  var contract = new web3.eth.Contract(
    _abiSettlements_v2,
    settlementsContractAddress
  );

  contract.methods
    .getAllSettlementsIParticipatedIn()
    .call()
    .then((settlements) => {
      createSettlementsIParticipatedInPage(settlements);
    });
}
