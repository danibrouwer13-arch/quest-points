const STORAGE_KEY = "quest-points-v1";

const randomTasks = [
  ["Ruim je bureau 10 minuten op", 10],
  ["Maak je bed", 5],
  ["Drink een glas water", 5],
  ["Doe 10 minuten huiswerk", 10],
  ["Leg je kleding netjes weg", 10],
  ["Loop 10 minuten buiten", 15],
  ["Ruim 5 dingen op die niet op hun plek liggen", 10],
  ["Lees 5 pagina's", 10],
  ["Maak een kleine taak af die je uitstelt", 20],
  ["Doe 10 minuten zonder telefoon iets nuttigs", 15],
  ["Organiseer één lade of plank", 15],
  ["Help iemand met een kleine taak", 20]
];

const sidequests = [
  ["Speedrun: ruim je kamer 5 minuten op", 20],
  ["Leer 15 minuten iets nieuws", 25],
  ["Doe een taak waar je al een tijdje tegenop ziet", 35],
  ["Maak vandaag één ding extra netjes", 20],
  ["Ga 15 minuten naar buiten", 25],
  ["Help iemand zonder dat die persoon erom vraagt", 30],
  ["Boss fight: maak één grote taak helemaal af", 50]
];

let state = loadState();
let activeSidequest = null;

const $ = (id) => document.getElementById(id);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tasks) && Number.isFinite(saved.xp)) return saved;
  } catch {}
  return { xp: 0, tasks: [], sidequestsCompleted: 0 };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function render() {
  state.xp = Math.max(0, Math.floor(state.xp));
  const level = Math.floor(state.xp / 100) + 1;
  const current = state.xp % 100;

  $("xpValue").textContent = state.xp;
  $("levelValue").textContent = `Level ${level}`;
  $("levelBadge").textContent = level;
  $("progressText").textContent = `${current} / 100 XP`;
  $("progressBar").style.width = `${current}%`;

  const open = state.tasks.filter(t => !t.done).length;
  const done = state.tasks.filter(t => t.done).length;
  $("openCount").textContent = open;
  $("doneCount").textContent = done;
  $("sideCount").textContent = state.sidequestsCompleted;

  const list = $("taskList");
  list.innerHTML = "";

  if (!state.tasks.length) {
    const empty = document.createElement("div");
    empty.className = "task-meta";
    empty.style.padding = "22px 2px";
    empty.textContent = "Nog geen quests. Maak je eerste taak hierboven.";
    list.appendChild(empty);
    return;
  }

  state.tasks.forEach((task, index) => {
    const row = document.createElement("div");
    row.className = `task ${task.done ? "completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Voltooi ${task.name}`);
    checkbox.addEventListener("change", () => toggleTask(index));

    const info = document.createElement("div");
    const name = document.createElement("div");
    name.className = "task-name";
    name.textContent = task.name;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = `${task.points} XP`;
    info.append(name, meta);

    const del = document.createElement("button");
    del.className = "delete";
    del.type = "button";
    del.textContent = "✕";
    del.title = "Verwijder taak";
    del.addEventListener("click", () => deleteTask(index));

    row.append(checkbox, info, del);
    list.appendChild(row);
  });
}

function addTask(name, points) {
  state.tasks.unshift({
    name,
    points: Math.max(1, Math.min(100, Number(points) || 10)),
    done: false
  });
  saveState();
  render();
}

function toggleTask(index) {
  const task = state.tasks[index];
  if (!task) return;

  task.done = !task.done;
  state.xp += task.done ? task.points : -task.points;
  state.xp = Math.max(0, state.xp);

  saveState();
  render();
  showToast(task.done ? `+${task.points} XP!` : `-${task.points} XP`);
}

function deleteTask(index) {
  const task = state.tasks[index];
  if (!task) return;
  if (task.done) state.xp = Math.max(0, state.xp - task.points);
  state.tasks.splice(index, 1);
  saveState();
  render();
  showToast("Quest verwijderd");
}

function chooseRandomTask() {
  const [name, points] = randomTasks[Math.floor(Math.random() * randomTasks.length)];
  $("taskInput").value = name;
  $("pointsInput").value = String(points);
  $("taskInput").focus();
  showToast("Random quest gekozen");
}

function newSidequest() {
  activeSidequest = sidequests[Math.floor(Math.random() * sidequests.length)];
  $("sidequestBox").innerHTML = "";
  const icon = document.createElement("div");
  icon.className = "quest-icon";
  icon.textContent = "!";
  const text = document.createElement("p");
  text.textContent = `${activeSidequest[0]} — +${activeSidequest[1]} XP`;
  $("sidequestBox").append(icon, text);
  $("completeSideBtn").disabled = false;
}

$("taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("taskInput");
  const name = input.value.trim();
  if (!name) {
    showToast("Vul eerst een taak in");
    input.focus();
    return;
  }
  addTask(name, $("pointsInput").value);
  input.value = "";
  showToast("Quest toegevoegd");
});

$("randomTaskBtn").addEventListener("click", chooseRandomTask);
$("doRandomBtn").addEventListener("click", chooseRandomTask);
$("sidequestBtn").addEventListener("click", newSidequest);

$("completeSideBtn").addEventListener("click", () => {
  if (!activeSidequest) return;
  state.xp += activeSidequest[1];
  state.sidequestsCompleted += 1;
  saveState();
  render();
  showToast(`Sidequest voltooid! +${activeSidequest[1]} XP`);
  activeSidequest = null;
  $("completeSideBtn").disabled = true;
  $("sidequestBox").innerHTML = '<div class="quest-icon">✓</div><p>Sidequest voltooid! Kies een nieuwe.</p>';
});

$("resetBtn").addEventListener("click", () => {
  if (!confirm("Alles resetten? Je XP en taken worden verwijderd.")) return;
  state = { xp: 0, tasks: [], sidequestsCompleted: 0 };
  activeSidequest = null;
  saveState();
  render();
  $("completeSideBtn").disabled = true;
  $("sidequestBox").innerHTML = '<div class="quest-icon">?</div><p>Klik op de knop en ontdek je volgende missie.</p>';
  showToast("Alles gereset");
});

render();
