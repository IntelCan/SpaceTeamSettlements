var participantToNameMap = {};

function addItem() {
  const div = document.createElement("div");
  div.classList.add("input-group");
  div.classList.add("mb-3");
  var ul = document.getElementById("list");
  var inputName = document.createElement("input");
  inputName.type = "text";
  inputName.name = "names[]";
  inputName.placeholder = "Address";
  inputName.required = true;
  inputName.classList.add("form-control");
  var inputCash = document.createElement("input");
  inputCash.type = "number";
  inputCash.name = "cash[]";
  inputCash.placeholder = "Amount";
  inputCash.required = true;
  inputCash.classList.add("form-control");
  var inputCurrency = document.createElement("input");
  inputCurrency.type = "text";
  inputCurrency.name = "currency[]";
  inputCurrency.placeholder = "Currency";
  inputCurrency.required = true;
  inputCurrency.classList.add("form-control");
  var deleteButton = document.createElement("button");
  deleteButton.innerHTML = "Delete";
  deleteButton.classList.add("btn");
  deleteButton.classList.add("btn-outline-secondary");
  deleteButton.onclick = function () {
    ul.removeChild(div);
  };
  div.appendChild(inputName);
  div.appendChild(inputCash);
  div.appendChild(inputCurrency);
  div.appendChild(deleteButton);
  ul.appendChild(div);
}

function addName() {
  var select = document.getElementById("nameSelect");
  var name = select.value;
  if (name != "") {
    const div = document.createElement("div");
    div.classList.add("input-group");
    div.classList.add("mb-3");

    var ul = document.getElementById("list");
    var inputName = document.createElement("input");
    inputName.type = "text";
    inputName.name = "names[]";
    inputName.value = name;
    inputName.required = true;
    inputName.classList.add("form-control");
    inputName.readOnly = true;
    var inputCash = document.createElement("input");
    inputCash.type = "number";
    inputCash.name = "cash[]";
    inputCash.placeholder = "Amount";
    inputCash.required = true;
    inputCash.classList.add("form-control");
    var inputCurrency = document.createElement("input");
    inputCurrency.type = "text";
    inputCurrency.name = "currency[]";
    inputCurrency.placeholder = "Currency";
    inputCurrency.required = true;
    inputCurrency.classList.add("form-control");
    var deleteButton = document.createElement("button");
    deleteButton.innerHTML = "Delete";
    deleteButton.classList.add("btn");
    deleteButton.classList.add("btn-outline-secondary");
    deleteButton.onclick = function () {
      ul.removeChild(div);
    };
    div.appendChild(inputName);
    div.appendChild(inputCash);
    div.appendChild(inputCurrency);
    div.appendChild(deleteButton);
    ul.appendChild(div);
  }
}

function submitForm() {
  event.preventDefault();

  const selectedNames = document.querySelectorAll("input[name='names[]']");
  if (selectedNames.length === 0) {
    alert("Please add at least one name.");
    return;
  }
  var form = document.getElementById("myForm");
  var formData = new FormData(form);
  var settlementName = formData.get("settlementName");
  var settlementDate = formData.get("settlementDate");
  var names = formData.getAll("names[]");
  var cashAmounts = formData.getAll("cash[]");
  var currencies = formData.getAll("currency[]");

  console.log(names);
  console.log(cashAmounts);
  console.log(currencies);
  console.log(settlementName);
  console.log(settlementDate);

  participants = [];
  for (let i = 0; i < names.length; i++) {
    participants.push({
      participant: names[i],
      currency: String(web3.utils.asciiToHex(currencies[i])).padEnd(66, "0"),
      amount: cashAmounts[i],
    });
  }

  settlement = {
    name: settlementName,
    date: dateToTimestamp(settlementDate),
    participants: participants,
  };

  console.log(settlement);

  var contract = new web3.eth.Contract(
    _abiSettlements_v2,
    settlementsContractAddress,
    {
      from: myAddress,
      gas: 5000000,
    }
  );

  contract.methods
    .addNewSettlement(settlement)
    .send()
    .then(() => {
      alert("Settlement created successfully!");
    });
}

function dateToTimestamp(date) {
  date = date.split("-");
  var newDate = new Date(date[0], date[1] - 1, date[2]);
  console.log(newDate.getTime() / 1000);
  return newDate.getTime() / 1000;
}

function populateNameSelect() {
  var nameSelect = document.getElementById("nameSelect");
  var option = document.createElement("option");
  option.value = "";
  option.text = "Select known participant";
  nameSelect.add(option);
  for (var name in participantToNameMap) {
    var option = document.createElement("option");
    option.value = participantToNameMap[name];
    option.text = name;
    nameSelect.add(option);
  }
}

function getKnownParticipantsNames() {
  var contract = new web3.eth.Contract(
    _abiSettlements_v2,
    settlementsContractAddress
  );

  contract.methods
    .getAllSettlementsIParticipatedIn()
    .call()
    .then((settlements) => {
      getNamesFromSettlements(settlements);
    });
}

function getNamesFromSettlements(settlements) {
  getNamesForParticipants(getAllParticipantsAddresses(settlements))
    .then((addressToNameMap) => {
      let map = addressToNameMap.reduce(function (map, obj) {
        map[obj[1]] = obj[0];
        return map;
      }, {});
      participantToNameMap = map;
      console.log(map);
      populateNameSelect();
    })
    .catch((error) => {
      console.log("Could not fetch names from name service");
      participantToNameMap = {};
      populateNameSelect();
    });
}
