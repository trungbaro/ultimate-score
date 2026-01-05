const list = document.getElementById("historyList");
const history = load("matchHistory") || [];

if (!history.length) {
  list.innerHTML = "<p>No matches yet.</p>";
}

history.reverse().forEach(m => {
  const div = document.createElement("div");
  div.className = "card mt-2";
  div.innerHTML = `
    <strong>${m.teamA} ${m.scoreA} – ${m.scoreB} ${m.teamB}</strong><br>
    <small>${new Date(m.startTime).toLocaleString()}</small>
  `;
  list.appendChild(div);
});
