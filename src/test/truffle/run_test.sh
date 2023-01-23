#!/bin/bash

currentDir=$(basename $(pwd))
if [ $currentDir != 'truffle' ]
then
	RED='\033[0;31m'
	echo -e "${RED}Finished with failure result. Run script from /src/test/truffle/"
	exit 0
fi	

cp -fr ../../solidity/* ./contracts/ &
truffle test
