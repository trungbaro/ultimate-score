function goCreate() {
  location.href = "index.html";
}

function goHistory() {
  location.href = "history.html";
}

function goResume() {
  const current = load("currentMatch");
  if (!current) {
    alert("No active match to resume.");
    return;
  }
  location.href = "game.html";
}
