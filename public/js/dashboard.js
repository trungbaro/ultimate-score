let DATA, T;
function openStats() {
  location.href = "/stats.html";
}

async function init() {
  DATA = await loadData();
  T = DATA.tournaments.find(t => t.id === DATA.currentTournament);

  title.textContent = T.name;
  renderMatches();
  renderLeaderboard();
  renderPlacement();
  if (canGoToPlacement()) {
    btnPlacement.classList.remove("hidden");
  } else {
    btnPlacement.classList.add("hidden");
  }

}

function teamName(id) {
  return T.teams.find(t => t.id === id).name;
}

function renderMatches() {
  matchList.innerHTML = "";

  const grouped = {};
  T.matches.forEach(m => {
    grouped[m.round] = grouped[m.round] || [];
    grouped[m.round].push(m);
  });

  Object.keys(grouped).forEach(r => {
    const roundDiv = document.createElement("div");
    roundDiv.className = "round";

    roundDiv.innerHTML = `<h3>Round ${r}</h3>`;

    grouped[r].forEach(m => {
      const div = document.createElement("div");
      div.className = "match-card";

      div.innerHTML = `
        <div class="match-info">
          <div class="teams">
            ${teamName(m.teamA)} vs ${teamName(m.teamB)}
          </div>
          <div class="meta">
            Field ${m.field} • 
            <span class="badge ${m.finished ? "played" : "pending"}">
              ${m.finished ? "Finished" : "Not played"}
            </span>
          </div>
        </div>

        <div>
          <div class="match-score">
            ${m.finished ? `${m.scoreA} - ${m.scoreB}` : "-"}
          </div>
          <button onclick="playMatch('${m.id}')">
            ${m.finished ? "View" : "Play"}
          </button>
        </div>
      `;

      roundDiv.appendChild(div);
    });

    matchList.appendChild(roundDiv);
  });
}

function renderMatch(m) {
  const div = document.createElement("div");
  div.className = "card mt-1";

  div.innerHTML = `
    ${teamName(m.teamA)} vs ${teamName(m.teamB)}<br>
    ${m.finished ? `${m.scoreA}-${m.scoreB}` : "Not played"}
    <button onclick="playMatch('${m.id}')">
      ${m.finished ? "View" : "Play"}
    </button>
  `;

  matchList.appendChild(div);
}

function renderLeaderboard() {
  leaderboard.innerHTML = "";

  if (T.format === "group" && T.groups) {
    renderGroupLeaderboard("A");
    renderGroupLeaderboard("B");
  } else {
    renderOverallLeaderboard();
  }
}

function renderGroupLeaderboard(groupName) {
  const teamIds = T.groups[groupName];
  if (!teamIds) return;

  const teams = T.teams
    .filter(t => teamIds.includes(t.id))
    .sort((a, b) => b.points - a.points);

  const box = document.createElement("div");
  box.className = "leaderboard";
  box.innerHTML = `<h3>Group ${groupName}</h3>`;

  box.innerHTML += `
    <div class="lb-row header">
      <div>#</div>
      <div>Team</div>
      <div>Pts</div>
    </div>
  `;

  teams.forEach((t, i) => {
    box.innerHTML += `
      <div class="lb-row">
        <div>${i + 1}</div>
        <div>${t.name}</div>
        <div class="lb-points">${t.points}</div>
      </div>
    `;
  });

  leaderboard.appendChild(box);
}

function renderOverallLeaderboard() {
  const teams = [...T.teams].sort((a, b) => b.points - a.points);

  const box = document.createElement("div");
  box.className = "leaderboard";
  box.innerHTML = `<h3>Overall Leaderboard</h3>`;

  box.innerHTML += `
    <div class="lb-row header">
      <div>#</div>
      <div>Team</div>
      <div>Pts</div>
    </div>
  `;

  teams.forEach((t, i) => {
    box.innerHTML += `
      <div class="lb-row">
        <div>${i + 1}</div>
        <div>${t.name}</div>
        <div class="lb-points">${t.points}</div>
      </div>
    `;
  });

  leaderboard.appendChild(box);
}

async function playMatch(id) {
  DATA.currentMatch = id;
  await saveData(DATA);
  location.href = "/game.html";
}

function isRobinFinished() {
  return T.matches.length && T.matches.every(m => m.finished);
}

function canGoToPlacement() {
  return (
    T.matches.length > 0 &&
    T.matches.every(m => m.finished) &&
    !T.placement 
  );
}

async function startPlacement() {
  // sort theo điểm
  const ranked = [...T.teams].sort((a, b) => b.points - a.points);

  if (ranked.length < 4) {
    alert("Need at least 4 teams for placement");
    return;
  }

  const finalA = ranked[0].id;
  const finalB = ranked[1].id;

  const thirdA = ranked[2].id;
  const thirdB = ranked[3].id;

  T.placement = {
    generated: true,
    matches: [
      {
        id: "p_final_" + Date.now(),
        type: "final",
        teamA: finalA,
        teamB: finalB,
        scoreA: null,
        scoreB: null,
        finished: false
      },
      {
        id: "p_3rd_" + Date.now(),
        type: "third",
        teamA: thirdA,
        teamB: thirdB,
        scoreA: null,
        scoreB: null,
        finished: false
      }
    ]
  };

  await saveData(DATA);
  renderPlacement();
}

function renderPlacement() {
  if (!T.placement) return;

  const box = document.createElement("div");
  box.className = "card mt-2";
  box.innerHTML = `<h3>🏆 Placement</h3>`;

  T.placement.matches.forEach(m => {
    const div = document.createElement("div");
    div.className = "match-card";

    const title =
      m.type === "final" ? "Final" : "3rd Place Match";

    div.innerHTML = `
      <div>
        <strong>${title}</strong><br>
        ${teamName(m.teamA)} vs ${teamName(m.teamB)}
      </div>

      <div>
        ${m.finished ? `${m.scoreA} - ${m.scoreB}` : "-"}
        <button onclick="playPlacement('${m.id}')">
          ${m.finished ? "View" : "Play"}
        </button>
      </div>
    `;

    box.appendChild(div);
  });

  matchList.appendChild(box);
}

async function playPlacement(id) {
  DATA.currentMatch = id;
  DATA.isPlacement = true; 
  await saveData(DATA);
  location.href = "/game.html";
}
init();
