function getDotClassForSettlement(settlement) {
  return settlement.finished ? "dot-green" : "dot-red";
}

function getDotClassForConfirmationStatus(confirmed) {
  return confirmed ? "dot-green" : "dot-red";
}

function generateParticipantTable(participants) {
  console.log(participants.length);
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

    body += `<tr><td>${participant.participant}</td>\n
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

function createAccordion(settlements) {
  var accordionDiv = document.getElementById("accordionExample");

  if (!settlements || settlements.length == 0) {
    accordionDiv.innerHTML = "NIE MA!";
  }

  for (entry in settlements) {
    console.log(settlements[entry]);
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
                ${settlement.name} - ${convertEpochToLocalDateString(
      settlement.date
    )} <span class="${getDotClassForSettlement(settlement)}"></span>
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
                    ${generateParticipantTable(settlement.participants)}
                  </ul>
                </div>
              </div>
            </div>`;

    newDiv.innerHTML = html;
    accordionDiv.appendChild(newDiv);
  }
}
