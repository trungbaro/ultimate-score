let DATA, tournament, team;

async function init() {
  DATA = await loadData();

  if (!DATA.currentTournament || !DATA.currentTeam) {
    alert("No team selected");
    location.href = "/teams.html";
    return;
  }

  tournament = DATA.tournaments.find(
    t => t.id === DATA.currentTournament
  );

  team = tournament.teams.find(
    t => t.id === DATA.currentTeam
  );

  if (!team) {
    alert("Team not found");
    location.href = "/teams.html";
    return;
  }

  // đảm bảo players là mảng
  team.players = team.players || [];
  render();
}

function render() {
  playerList.innerHTML = "";

  if (!team.players.length) {
    playerList.innerHTML = "<p>No players yet.</p>";
    return;
  }

  team.players.forEach(p => {
    const div = document.createElement("div");
    div.className = "player-row";
    div.innerHTML = `
      <div class="player-info">
        <span class="player-jersey">#${p.jersey}</span>
        <span class="player-name">${p.name}</span>
      </div>

      <button class="player-delete"
        onclick="deletePlayer('${p.id}')"
        title="Delete player">
        ✖
      </button>
    `;

    playerList.appendChild(div);
  });
}

async function deletePlayer(playerId) {
  if (!confirm("Delete this player?")) return;

  team.players = team.players.filter(p => p.id !== playerId);
  await saveData(DATA);
  render();
}

async function addPlayer() {
  const name = playerName.value.trim();
  const jerseyNum = jersey.value.trim();

  if (!name || !jerseyNum) {
    alert("Enter player name and jersey number");
    return;
  }

  // tránh trùng số áo
  if (team.players.some(p => p.jersey == jerseyNum)) {
    alert("Jersey number already exists");
    return;
  }

  team.players.push({
    id: "p_" + Date.now(),
    name,
    jersey: jerseyNum
  });

  await saveData(DATA);

  playerName.value = "";
  jersey.value = "";
  render();
}

init();
