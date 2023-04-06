import {ethers, getNamedAccounts} from 'hardhat';
// example script

async function main() {
  const { deployer } = await getNamedAccounts()
  const nameService = await ethers.getContract("NameService", deployer)
  console.log("Setting name for deployer")
	const txResponse = await nameService.setNewName("Igor")
  await txResponse.wait(1)

  const names = await nameService.getNamesFor([deployer])
  console.log(names);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});