let DATA, T, M, teamA, teamB;

async function init() {
  DATA = await loadData();

  if (!DATA.currentTournament || !DATA.currentMatch) {
    alert("No active match");
    location.href = "/dashboard.html";
    return;
  }

  T = DATA.tournaments.find(t => t.id === DATA.currentTournament);
  //M = T.matches.find(m => m.id === DATA.currentMatch);
  M =
    T.matches.find(m => m.id === DATA.currentMatch) ||
    T.placement?.matches.find(m => m.id === DATA.currentMatch);

  if (!M) {
    alert("Match not found");
    location.href = "/dashboard.html";
    return;
  }

  // init score + undo
  M.scoreA ??= 0;
  M.scoreB ??= 0;
  M.undoStack ??= [];

  // lấy team object
  teamA = T.teams.find(t => t.id === M.teamA);
  teamB = T.teams.find(t => t.id === M.teamB);

  // hiển thị tên đội
  document.getElementById("teams").textContent =
    `${teamA.name} vs ${teamB.name}`;

  // 🔥 đổi tên nút theo tên đội
  document.getElementById("btnTeamA").textContent =
    `+ ${teamA.name}`;

  document.getElementById("btnTeamB").textContent =
    `+ ${teamB.name}`;

  render();
  M.points ??= [];

  document.getElementById("teamALabel").textContent = teamA.name;
  document.getElementById("teamBLabel").textContent = teamB.name;

  renderPoints();
  renderSummary();
}

function render() {
  document.getElementById("scoreA").textContent = M.scoreA;
  document.getElementById("scoreB").textContent = M.scoreB;
}

async function addScore(side) {
  // undo snapshot
  M.undoStack.push({
    scoreA: M.scoreA,
    scoreB: M.scoreB,
    points: JSON.parse(JSON.stringify(M.points))
  });

  if (side === "A") M.scoreA++;
  if (side === "B") M.scoreB++;

  // thêm point log mới
  M.points.push({
    team: side,
    scorerId: null,
    assistId: null
  });

  await saveData(DATA);
  render();
  renderPoints();
}

async function undo() {
  if (!M.undoStack.length) {
    alert("Nothing to undo");
    return;
  }

  const prev = M.undoStack.pop();
  M.scoreA = prev.scoreA;
  M.scoreB = prev.scoreB;
  M.points = prev.points;

  await saveData(DATA);
  render();
  renderPoints();
}

async function endMatch() {
  M.finished = true;

  // cộng leaderboard
  if (!DATA.isPlacement) {
    teamA.points ??= 0;
    teamB.points ??= 0;

    if (M.scoreA > M.scoreB) teamA.points += 1;
    else if (M.scoreB > M.scoreA) teamB.points += 1;
  }

  DATA.currentMatch = null;
  DATA.isPlacement = false;
  await saveData(DATA);

  location.href = "/dashboard.html";
}

function renderPoints() {
  tableA.innerHTML = `
    <tr>
      <th>#</th><th>Scorer</th><th>Assist</th>
    </tr>
  `;

  tableB.innerHTML = `
    <tr>
      <th>#</th><th>Scorer</th><th>Assist</th>
    </tr>
  `;

  let countA = 1;
  let countB = 1;

  M.points.forEach((p, idx) => {
    const team = p.team === "A" ? teamA : teamB;
    const table = p.team === "A" ? tableA : tableB;
    const index = p.team === "A" ? countA++ : countB++;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index}</td>
      <td>${playerSelect(team.players, p.scorerId, idx, "scorer")}</td>
      <td>${playerSelect(team.players, p.assistId, idx, "assist")}</td>
    `;

    table.appendChild(row);
  });
}

function playerSelect(players, selectedId, pointIndex, type) {
  const selected = players.find(p => p.id === selectedId);

  return `
    <div class="search-select">
      <input
        type="text"
        placeholder="Search..."
        value="${selected ? `#${selected.jersey} ${selected.name}` : ""}"
        oninput="filterPlayers(this, ${pointIndex}, '${type}')"
        onfocus="showOptions(this)"
        autocomplete="off"
      />
      <div class="options hidden">
        ${players
          .map(
            p => `
            <div class="option"
              onclick="selectPlayer('${p.id}', '${p.name}', '${p.jersey}', ${pointIndex}, '${type}', this)">
              #${p.jersey} ${p.name}
            </div>`
          )
          .join("")}
      </div>
    </div>
  `;
}


function calculateStats(team) {
  const stats = {};

  team.players.forEach(p => {
    stats[p.id] = {
      name: p.name,
      jersey: p.jersey,
      goals: 0,
      assists: 0
    };
  });

  M.points.forEach(p => {
    if (p.scorerId && stats[p.scorerId]) {
      stats[p.scorerId].goals++;
    }
    if (p.assistId && stats[p.assistId]) {
      stats[p.assistId].assists++;
    }
  });

  return Object.values(stats).sort(
  (a, b) => Number(a.jersey) - Number(b.jersey)
  );
}

function renderSummary() {
  summaryTeamA.textContent = teamA.name;
  summaryTeamB.textContent = teamB.name;

  summaryA.innerHTML = `
    <tr>
      <th>#</th><th>Player</th><th>Goals</th><th>Assists</th>
    </tr>
  `;
  summaryB.innerHTML = `
    <tr>
      <th>#</th><th>Player</th><th>Goals</th><th>Assists</th>
    </tr>
  `;

  calculateStats(teamA).forEach(p => {
    summaryA.innerHTML += `
      <tr>
        <td>#${p.jersey}</td>
        <td>${p.name}</td>
        <td>${p.goals}</td>
        <td>${p.assists}</td>
      </tr>
    `;
  });

  calculateStats(teamB).forEach(p => {
    summaryB.innerHTML += `
      <tr>
        <td>#${p.jersey}</td>
        <td>${p.name}</td>
        <td>${p.goals}</td>
        <td>${p.assists}</td>
      </tr>
    `;
  });
}

function showOptions(input) {
  input.nextElementSibling.classList.remove("hidden");
}

function filterPlayers(input, pointIndex, type) {
  const keyword = input.value.toLowerCase();
  const options = input.nextElementSibling.querySelectorAll(".option");

  options.forEach(opt => {
    opt.style.display = opt.textContent
      .toLowerCase()
      .includes(keyword)
      ? "block"
      : "none";
  });
}

async function selectPlayer(id, name, jersey, index, type, el) {
  const container = el.closest(".search-select");
  const input = container.querySelector("input");

  input.value = `#${jersey} ${name}`;
  container.querySelector(".options").classList.add("hidden");

  if (type === "scorer") M.points[index].scorerId = id;
  if (type === "assist") M.points[index].assistId = id;

  await saveData(DATA);
}

init();
