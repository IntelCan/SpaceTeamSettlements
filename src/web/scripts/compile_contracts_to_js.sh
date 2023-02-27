#!/bin/bash
CONTRACTS_DIR="./src/contracts/*"

for f in $CONTRACTS_DIR
do
  file=$(basename $f .sol)
  solcjs --bin --abi --include-path node_modules/ --base-path . -o ./build ${f}

  pushd build
  compiledName=$(find . -name "*${file}*" ! -name "*.js" -print | cut -d. -f2 | cut -d/ -f2 | uniq)
  /bin/cat <<EOF >"$file.js"
  var _data$file = "0x$(cat $compiledName.bin)";
  var _abi$file = $(cat $compiledName.abi);
EOF
  popd
done




