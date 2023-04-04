// if (typeof web3 !== 'undefined') {
//  web3 = new Web3(web3.currentProvider);
// console.log("Usywam czegos innego");
// } else {
//    console.log("Uzywam localhot")
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
//}

if (web3 === "undefined") {
  console.log("Obiekt web3 nie został zainicjalizowany");
} else {
  console.log("Obiekt web3 został zainicjalizowany");
}
