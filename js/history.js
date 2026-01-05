const list = document.getElementById("historyList");
const history = load("matchHistory") || [];

if (!history.length) {
  list.innerHTML = "<p>No matches yet.</p>";
}

function deleteMatch(id) {
  const history = load("matchHistory") || [];
  const newHistory = history.filter(m => m.id !== id);
  save("matchHistory", newHistory);
  location.reload();
}

history.forEach(m => {
  const div = document.createElement("div");
  div.className = "card mt-2";
  div.innerHTML = `
    <strong>${m.teamA} ${m.scoreA} – ${m.scoreB} ${m.teamB}</strong><br>
    <small>${new Date(m.startTime).toLocaleString()}</small><br>
    <button onclick="deleteMatch('${m.id}')">Delete</button>
  `;
  list.appendChild(div);
});
