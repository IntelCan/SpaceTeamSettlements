const SettlementMechanism = artifacts.require("SettlementMechanism");

module.exports = function (deployer) {
  deployer.deploy(SettlementMechanism);
};
