function getDotClassForSettlement(settlement) {
  return settlement.finished ? "dot-green" : "dot-red";
}

function getDotClassForConfirmationStatus(confirmed) {
  return confirmed ? "dot-green" : "dot-red";
}

function getNameOrDefaultToAddress(addresToNameMap, address) {
  if (!addresToNameMap[address]) {
    return address;
  }
  return addresToNameMap[address];
}

function generateParticipantTable(participants, addresToNameMap) {
  const heading = `
          <thead>
            <tr>
              <th scope="col">Participant</th>
              <th scope="col">Obligation</th>
              <th scope="col">Confirmed</th>
            </tr>
          </thead>
          `;

  let body = "";
  for (entry in participants) {
    const participant = participants[entry];
    const currency = web3.utils.hexToAscii(participant.currency.substr(0, 8));

    body += `<tr><td>${getNameOrDefaultToAddress(
      addresToNameMap,
      participant.participant
    )}</td>\n
            <td>${participant.amount} ${currency}</td>\n
            <td><span class="${getDotClassForConfirmationStatus(
              participant.confirmed
            )}"></span></td>\n</tr>`;
  }

  let result = `
          <table class="table">
            <thead>
              <tr>
                ${heading}
              </tr>
            </thead>
            <tbody>
              ${body}
            </tbody>
          </table>
            `;
  return result;
}

function convertEpochToLocalDateString(epoch) {
  var date = new Date(0);
  date.setUTCSeconds(epoch);
  const offset = date.getTimezoneOffset();
  date = new Date(date.getTime() - offset * 60 * 1000);
  return date.toISOString().split("T")[0];
}

function getAllParticipantsAddresses(settlements) {
  let addresses = [];
  for (entry in settlements) {
    const settlement = settlements[entry];
    addresses.push(settlement.payer);
    for (entry in settlement.participants) {
      const participant = settlement.participants[entry];
      addresses.push(participant.participant);
    }
  }
  addresses = [...new Set(addresses)];
  return addresses;
}

function createAccordion(settlements, addresToNameMap) {
  var accordionDiv = document.getElementById("accordionExample");
  for (entry in settlements) {
    var settlement = settlements[entry];
    var newDiv = document.createElement("div");
    newDiv.id = `${settlement.id}`;
    newDiv.className = "accordion-item";

    const html = `<div class="accordion-item">
              <h2 class="accordion-header" id="heading${settlement.id}">
                <button
                  class="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse${settlement.id}"
                  aria-expanded="true"
                  aria-controls="collapse${settlement.id}"
                >
                <div class="col-3"><strong>Name: </strong>${
                  settlement.name
                }</div>  
                <div class="col-3"><strong>Payer: </strong>${getNameOrDefaultToAddress(
                  addresToNameMap,
                  settlement.payer
                )}</div>  
                <div class="col-3"><strong>Date: </strong>${convertEpochToLocalDateString(
                  settlement.date
                )}</div> 
                <div class="col-3"><strong>Finished: </strong><span class="${getDotClassForSettlement(
                  settlement
                )}"></span></div>
                </button>
              </h2>
              <div
                id="collapse${settlement.id}"
                class="accordion-collapse collapse"
                aria-labelledby="heading${settlement.id}"
                data-bs-parent="#accordionExample"
              >
                <div class="accordion-body">
                  <ul >
                    ${generateParticipantTable(
                      settlement.participants,
                      addresToNameMap
                    )}
                  </ul>
                </div>
              </div>
            </div>`;

    newDiv.innerHTML = html;
    accordionDiv.appendChild(newDiv);
  }
}

function createSettlementsIParticipatedInPage(settlements) {
  if (!settlements || settlements.length == 0) {
    var accordionDiv = document.getElementById("accordionExample");
    var newDiv = document.createElement("div");
    newDiv.id = `no_results`;
    newDiv.innerHTML = "<h2>No results</h2>";
    accordionDiv.appendChild(newDiv);
    return;
  }

  getNamesForParticipants(getAllParticipantsAddresses(settlements))
    .then((addressToNameMap) => {
      let map = addressToNameMap.reduce(function (map, obj) {
        map[obj[0]] = obj[1];
        return map;
      }, {});
      createAccordion(settlements, map);
    })
    .catch((error) => {
      console.log("Could not fetch names from name service");
      createAccordion(settlements, {});
    });
}
