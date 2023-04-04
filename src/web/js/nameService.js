//TODO: for local developement
const nameServiceContractAddress = "0x045aD1745464269E749d61169B9C145eDF082b82";

function getNamesForParticipants(participantAddresses) {
  var contract = new web3.eth.Contract(
    _abiNameService,
    nameServiceContractAddress
  );

  return contract.methods.getNamesFor(participantAddresses).call();
}
