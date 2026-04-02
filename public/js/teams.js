let DATA, tournament;

async function init() {
  DATA = await loadData();

  if (!DATA.currentTournament) {
    alert("No tournament selected");
    location.href = "/tournament.html";
    return;
  }

  tournament = DATA.tournaments.find(
    t => t.id === DATA.currentTournament
  );

  tournament.teams = tournament.teams || [];
  render();
}

function render() {
  teamList.innerHTML = "";

  if (!tournament.teams.length) {
    teamList.innerHTML = "<p>No teams yet.</p>";
    return;
  }

  tournament.teams.forEach(t => {
    const div = document.createElement("div");
    div.className = "card mt-2";
    div.innerHTML = `
      <div class="team-header">
        <span class="team-name">${t.name}</span>
      </div>

      <div class="team-actions-row">
        <button class="secondary team-btn"
          onclick="openPlayers('${t.id}')">
          👥 Players
        </button>

        <button class="danger team-delete"
          onclick="deleteTeam('${t.id}')"
          title="Delete team">
          ✖
        </button>
      </div>
    `;

    teamList.appendChild(div);
  });
}

async function addTeam() {
  const name = teamName.value.trim();
  if (!name) {
    alert("Enter team name");
    return;
  }

  const team = {
    id: "team_" + Date.now(),
    name,
    players: [],
    points: 0
  };

  tournament.teams.push(team);
  await saveData(DATA);

  teamName.value = "";
  render();
}

async function openPlayers(teamId) {
  DATA.currentTeam = teamId;
  await saveData(DATA);
  location.href = "/players.html";
}

async function deleteTeam(teamId) {
  if (!confirm("Delete this Team?")) return;

  tournament.teams = tournament.teams.filter(
    t => t.id !== teamId
  );
  await saveData(DATA);
  render();
}


async function generateBracket() {
  const teams = tournament.teams;

  if (teams.length < 2) {
    alert("Need at least 2 teams");
    return;
  }

  // clone team ids
  let teamIds = teams.map(t => t.id);

  // nếu lẻ thì thêm BYE
  const hasBye = teamIds.length % 2 === 1;
  if (hasBye) teamIds.push(null); // null = BYE

  const rounds = teamIds.length - 1;
  const half = teamIds.length / 2;

  tournament.matches = [];

  let rotating = [...teamIds];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const teamA = rotating[i];
      const teamB = rotating[rotating.length - 1 - i];

      // bỏ BYE
      if (teamA && teamB) {
        tournament.matches.push({
          id: `m_${Date.now()}_${r}_${i}`,
          round: r + 1,
          teamA,
          teamB,
          scoreA: null,
          scoreB: null,
          finished: false
        });
      }
    }

    // xoay vòng (giữ team đầu cố định)
    rotating = [
      rotating[0],
      rotating[rotating.length - 1],
      ...rotating.slice(1, rotating.length - 1)
    ];
  }

  await saveData(DATA);
  location.href = "/dashboard.html";
}

function chooseFormat() {
  if (tournament.teams.length < 2) {
    alert("Need at least 2 teams");
    return;
  }

  // 🔒 NẾU ĐÃ CÓ BRACKET → KHÔNG TẠO LẠI
  if (tournament.matches && tournament.matches.length > 0) {
    const go = confirm(
      "Bracket already exists.\n\nOK = View Bracket\nCancel = Generate New Bracket"
    );

    if (go) {
      location.href = "/dashboard.html";
      return;
    } else {
      // người dùng MUỐN tạo lại nen xóa cũ
      tournament.matches = [];
      tournament.format = null;
      tournament.groups = null;
      tournament.placement = null;
      tournament.teams.forEach(t => {
        t.points = 0;
      });
      DATA.isPlacement = false;
      DATA.currentMatch = null;
      tournament.teams.forEach(t => {
        t.points = 0;

        t.players.forEach(p => {
          p.goals = 0;
          p.assists = 0;
        });
      })
    }
  }

  document.getElementById("formatModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("formatModal").classList.add("hidden");
}

function selectFormat(option) {
  closeModal();

  if (option === 1) {
    generateGroupRobin();
  } else if (option === 2) {
    generateFullRobin();
  }
}

function generateFullRobin() {
  let teamIds = tournament.teams.map(t => t.id);

  // nếu lẻ → thêm BYE
  const hasBye = teamIds.length % 2 === 1;
  if (hasBye) teamIds.push(null); // null = BYE

  tournament.format = "full";
  tournament.groups = null;
  tournament.matches = [];

  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const a = teamIds[i];
      const b = teamIds[j];

      // nếu gặp BYE → không tạo match
      if (!a || !b) continue;

      tournament.matches.push({
        id: `m_${Date.now()}_${i}_${j}`,
        teamA: a,
        teamB: b,
        scoreA: null,
        scoreB: null,
        finished: false
      });
    }
  }
  const fields = Number(document.getElementById("fieldCount").value) || 1;
  const result = scheduleMatches(tournament.matches, fields);
  tournament.matches = result.schedule;
  tournament.fields = fields;
  tournament.lastPlayed = result.lastPlayed;

  saveAndGo();
}

function generateGroupRobin() {
  const shuffled = [...tournament.teams].sort(
    () => Math.random() - 0.5
  );

  const mid = Math.ceil(shuffled.length / 2);
  const groupA = shuffled.slice(0, mid);
  const groupB = shuffled.slice(mid);

  tournament.format = "group";
  tournament.groups = {
    A: groupA.map(t => t.id),
    B: groupB.map(t => t.id)
  };

  tournament.matches = [];

  generateGroupMatches("A", groupA);
  generateGroupMatches("B", groupB);
  const fields = Number(document.getElementById("fieldCount").value) || 1;
  const result = scheduleMatches(tournament.matches, fields);
  tournament.matches = result.schedule;
  tournament.fields = fields;
  tournament.lastPlayed = result.lastPlayed;

  saveAndGo();
}

function generateGroupMatches(groupName, teams) {
  let ids = teams.map(t => t.id);

  if (ids.length % 2 === 1) {
    ids.push(null); // BYE
  }

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (!ids[i] || !ids[j]) continue;

      tournament.matches.push({
        id: `m_${groupName}_${Date.now()}_${i}_${j}`,
        group: groupName,
        teamA: ids[i],
        teamB: ids[j],
        scoreA: null,
        scoreB: null,
        finished: false
      });
    }
  }
}

async function saveAndGo() {
  await saveData(DATA);
  location.href = "/dashboard.html";
}

function scheduleMatches(matches, fields) {
  const schedule = [];
  const lastPlayed = {}; // teamId -> round
  let round = 1;

  let queue = [...matches];

  while (queue.length) {
    const usedTeams = new Set();
    const roundMatches = [];

    // ===== PHA 1: tránh đánh liên tục =====
    for (let i = 0; i < queue.length && roundMatches.length < fields; i++) {
      const m = queue[i];
      const { teamA: a, teamB: b } = m;

      if (
        usedTeams.has(a) ||
        usedTeams.has(b) ||
        lastPlayed[a] === round - 1 ||
        lastPlayed[b] === round - 1
      ) {
        continue;
      }

      roundMatches.push(m);
      usedTeams.add(a);
      usedTeams.add(b);
      queue.splice(i, 1);
      i--;
    }

    // ===== PHA 2: cho phép đánh liên tục nếu cần =====
    for (let i = 0; i < queue.length && roundMatches.length < fields; i++) {
      const m = queue[i];
      const { teamA: a, teamB: b } = m;

      if (usedTeams.has(a) || usedTeams.has(b)) continue;

      roundMatches.push(m);
      usedTeams.add(a);
      usedTeams.add(b);
      queue.splice(i, 1);
      i--;
    }

    // gán round + field
    roundMatches.forEach((m, idx) => {
      m.round = round;
      m.field = idx + 1;
      lastPlayed[m.teamA] = round;
      lastPlayed[m.teamB] = round;
      schedule.push(m);
    });

    round++;
  }

  return { schedule, lastPlayed };
}


init();
