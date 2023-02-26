if (typeof web3 !== "undefined") {
  web3 = new Web3(web3.currentProvider);
  console.log("Usywam czegos innego");
} else {
  console.log("Uzywam localhost");
  web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:7545"));
}

if (web3 === "undefined") {
  console.log("Web3 was not initialized!");
} else {
  console.log("Web3 was initialized successfully!");
}
