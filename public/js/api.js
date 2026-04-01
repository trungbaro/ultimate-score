console.log("api.js loaded");

async function loadData() {
  const res = await fetch("/api/data");
  return res.json();
}

async function saveData(data) {
  await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}
