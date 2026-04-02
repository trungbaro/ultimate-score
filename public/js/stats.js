let DATA, T, allStats = [];

async function init() {
  DATA = await loadData();

  if (!DATA.currentTournament) {
    alert("No tournament selected");
    location.href = "/";
    return;
  }

  T = DATA.tournaments.find(
    t => t.id === DATA.currentTournament
  );

  buildStats();
  buildTeamFilter();
  applyFilter();
}

function buildStats() {
  const map = {};

  // init players
  T.teams.forEach(team => {
    team.players.forEach(p => {
      map[p.id] = {
        player: p.name,
        jersey: Number(p.jersey),
        team: team.name,
        teamId: team.id,
        goals: 0,
        assists: 0
      };
    });
  });

  let allMatches = [...T.matches];
  if (T.placement && T.placement.matches) {
    allMatches = allMatches.concat(T.placement.matches);
  }
  // count from matches
  allMatches
    .filter(m => m.finished)
    .forEach(m => {
      (m.points || []).forEach(pt => {
        if (pt.scorerId && map[pt.scorerId]) {
          map[pt.scorerId].goals++;
        }
        if (pt.assistId && map[pt.assistId]) {
          map[pt.assistId].assists++;
        }
      });
    });

  allStats = Object.values(map).map(p => ({
    ...p,
    total: p.goals + p.assists
  }));
}

function buildTeamFilter() {
  const select = document.getElementById("teamFilter");

  T.teams.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    select.appendChild(opt);
  });
}

function applyFilter() {
  const teamVal = document.getElementById("teamFilter").value;
  const sortBy = document.getElementById("sortBy").value;
  const keyword = document
    .getElementById("searchInput")
    .value.toLowerCase();

  let list = [...allStats];

  // filter team
  if (teamVal !== "all") {
    list = list.filter(p => p.teamId === teamVal);
  }
  if (keyword) {
    list = list.filter(p =>
      p.player.toLowerCase().includes(keyword)
    );
  }
  // sort
  list.sort((a, b) => {
    if (sortBy === "goals") return b.goals - a.goals;
    if (sortBy === "assists") return b.assists - a.assists;
    if (sortBy === "total") return b.total - a.total;
    if (sortBy === "jersey") return a.jersey - b.jersey;
    return 0;
  });

  render(list);
}

function render(list) {
  const tbody = document.querySelector("#statsTable tbody");
  tbody.innerHTML = "";

  list.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>#${p.jersey}</td>
        <td>${p.player}</td>
        <td>${p.team}</td>
        <td>${p.goals}</td>
        <td>${p.assists}</td>
        <td>${p.total}</td>
      </tr>
    `;
  });
}

init();
