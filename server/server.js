const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static("public"));

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/api/data", (req, res) => {
  res.json(readData());
});

app.post("/api/data", (req, res) => {
  writeData(req.body);
  res.json({ ok: true });
});

app.delete("/api/history", (req, res) => {
  const data = readData();
  data.matches = [];
  writeData(data);
  res.json({ ok: true });
});

app.delete("/api/history/:id", (req, res) => {
  const data = readData();
  const id = req.params.id;

  data.matches = data.matches.filter(m => m.id !== id);
  writeData(data);

  res.json({ ok: true });
});


app.listen(3000, () => {
  console.log("✅ http://localhost:3000");
});
