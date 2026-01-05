function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function load(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function remove(key) {
  localStorage.removeItem(key);
}
