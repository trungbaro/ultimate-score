let DATA;

async function init() {
  DATA = await loadData();
  DATA.tournaments = DATA.tournaments || [];
  render();
}

function render() {
  list.innerHTML = "";

  if (!DATA.tournaments.length) {
    list.innerHTML = "<p>No tournaments yet.</p>";
    return;
  }

  DATA.tournaments.forEach(t => {
    const div = document.createElement("div");
    div.className = "card mt-2";

    div.innerHTML = `
      <div class="team-actions-row">
        <strong>${t.name}</strong><br>
        <small>Created: ${new Date(t.createdAt).toLocaleString()}</small><br>
        <button class="secondary mt-1" onclick="selectTournament('${t.id}')">
          Manage
        </button>
        <button class="danger small"
          onclick="deleteTournament('${t.id}')">
          ✖
        </button>
      </div>
    `;

    list.appendChild(div);
  });
}

async function deleteTournament(tournamentId) {
  const t = DATA.tournaments.find(x => x.id === tournamentId);

  if (!t) return;

  const msg =
    "Delete this tournament?\n\n" +
    "This will permanently remove:\n" +
    "- All teams\n" +
    "- All matches\n" +
    "- Round robin & elimination brackets\n" +
    "- Player stats\n\n" +
    "This action CANNOT be undone.";

  if (!confirm(msg)) return;

  // ❌ xóa tournament (bracket nằm trong đây)
  DATA.tournaments = DATA.tournaments.filter(
    t => t.id !== tournamentId
  );

  // reset current tournament nếu cần
  if (DATA.currentTournament === tournamentId) {
    DATA.currentTournament = null;
    DATA.currentMatch = null;
    DATA.currentElimMatch = null;
  }

  await saveData(DATA);
  renderTournaments(); // render lại menu
}

async function createTournament() {
  const name = tName.value.trim();
  if (!name) {
    alert("Enter tournament name");
    return;
  }

  const tournament = {
    id: "t_" + Date.now(),
    name,
    teams: [],
    createdAt: new Date().toISOString()
  };

  DATA.tournaments.push(tournament);
  DATA.currentTournament = tournament.id;

  await saveData(DATA);
  tName.value = "";
  render();
}

async function selectTournament(id) {
  DATA.currentTournament = id;
  await saveData(DATA);
  location.href = "/teams.html";
}


init();
