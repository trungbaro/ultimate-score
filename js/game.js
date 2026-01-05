let match = load("currentMatch");
if (!match) location.href = "index.html";

const historyStack = [];

teamAName.textContent = match.teamA;
teamBName.textContent = match.teamB;

function render() {
  scoreA.textContent = match.scoreA;
  scoreB.textContent = match.scoreB;
  save("currentMatch", match);
}

function addScore(team) {
  historyStack.push({ a: match.scoreA, b: match.scoreB });

  team === "A" ? match.scoreA++ : match.scoreB++;
  render();

  if (match.scoreLimit && (match.scoreA >= match.scoreLimit || match.scoreB >= match.scoreLimit)) {
    endGame();
  }
}

function undo() {
  if (!historyStack.length) return;
  const last = historyStack.pop();
  match.scoreA = last.a;
  match.scoreB = last.b;
  render();
}

function endGame() {
  match.endTime = new Date().toISOString();
  const history = load("matchHistory") || [];
  history.push(match);
  save("matchHistory", history);
  remove("currentMatch");
  location.href = "history.html";
}

/* TIMER */
const start = Date.now();
setInterval(() => {
  const diff = Date.now() - start;
  timer.textContent =
    String(Math.floor(diff / 60000)).padStart(2, "0") + ":" +
    String(Math.floor(diff / 1000 % 60)).padStart(2, "0");
}, 1000);

render();
