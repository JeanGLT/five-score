// Five score counter.
// The whole game lives in one `state` object saved in localStorage,
// so closing the app or locking the iPhone never loses the game.

const STORAGE_KEY = "five-score-v1";
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

// state.players: list of names
// state.max: score limit (a player is eliminated when total > max)
// state.rounds: list of rounds, each round = { playerIndex: points }
let state = load() || { players: [], max: 100, rounds: [], started: false };

// Setup screen draft (not saved until the game starts)
let setupCount = Math.max(state.players.length, 3);
let setupMax = state.max;
let setupNames = [...state.players];

const $ = (id) => document.getElementById(id);

// ---------- Saving ----------

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
}

// ---------- Game rules ----------

function totals() {
  return state.players.map((_, i) =>
    state.rounds.reduce((sum, round) => sum + (round[i] || 0), 0)
  );
}

// Points only go up, so once a player is above the limit they stay out.
function isOut(total) {
  return total > state.max;
}

// Returns the winner's index, or null if the game is still going.
function findWinner() {
  const t = totals();
  const alive = t.map((total, i) => i).filter((i) => !isOut(t[i]));
  if (alive.length === 1) return alive[0];
  if (alive.length === 0) {
    // Everyone left went over in the same round: among the players
    // who played that round, the lowest score wins
    const lastRound = state.rounds[state.rounds.length - 1];
    const finalists = Object.keys(lastRound).map(Number);
    return finalists.reduce((best, i) => (t[i] < t[best] ? i : best));
  }
  return null;
}

// ---------- Setup screen ----------

function renderSetup() {
  $("player-count").textContent = setupCount;
  $("minus-player").disabled = setupCount <= MIN_PLAYERS;
  $("plus-player").disabled = setupCount >= MAX_PLAYERS;

  const box = $("name-inputs");
  box.innerHTML = "";
  for (let i = 0; i < setupCount; i++) {
    const input = document.createElement("input");
    input.placeholder = `Joueur ${i + 1}`;
    input.value = setupNames[i] || "";
    input.autocapitalize = "words";
    input.enterKeyHint = i < setupCount - 1 ? "next" : "done";
    input.addEventListener("input", () => { setupNames[i] = input.value; });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const next = box.children[i + 1];
      next ? next.focus() : input.blur();
    });
    box.appendChild(input);
  }

  document.querySelectorAll("#max-choices button").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.max) === setupMax);
  });
}

$("minus-player").onclick = () => { setupCount--; renderSetup(); };
$("plus-player").onclick = () => { setupCount++; renderSetup(); };

$("max-choices").onclick = (e) => {
  if (!e.target.dataset.max) return;
  setupMax = Number(e.target.dataset.max);
  renderSetup();
};

$("start").onclick = () => {
  const names = [];
  for (let i = 0; i < setupCount; i++) {
    names.push((setupNames[i] || "").trim() || `Joueur ${i + 1}`);
  }
  state = { players: names, max: setupMax, rounds: [], started: true };
  save();
  showGame();
};

// ---------- Game screen ----------

function renderGame() {
  const t = totals();
  const alive = t.filter((total) => !isOut(total));
  const best = alive.length ? Math.min(...alive) : null;

  $("game-info").innerHTML =
    `Manche <strong>${state.rounds.length + 1}</strong> · Limite <strong>${state.max}</strong>`;

  const list = $("scoreboard");
  list.innerHTML = "";
  state.players.forEach((name, i) => {
    const total = t[i];
    const out = isOut(total);
    const left = state.max - total;
    const li = document.createElement("li");
    li.className = "player";
    if (out) li.classList.add("out");
    else if (left <= state.max * 0.2) li.classList.add("warn");
    if (!out && state.rounds.length && total === best) li.classList.add("leader");

    const pct = Math.min(100, (total / state.max) * 100);
    li.innerHTML = `
      <div class="line">
        <span class="name"></span>
        <span class="score">${total}</span>
      </div>
      <div class="left">${out ? "Éliminé" : `Encore ${left} pts avant élimination`}</div>
      <div class="bar"><div style="width:${pct}%"></div></div>`;
    li.querySelector(".name").textContent = name; // textContent avoids HTML injection
    list.appendChild(li);
  });

  $("undo").disabled = state.rounds.length === 0;
  renderHistory();
}

function renderHistory() {
  const box = $("history");
  if (!state.rounds.length) {
    box.innerHTML = `<p style="color:var(--muted);margin:0">Aucune manche jouée.</p>`;
    return;
  }
  const head = state.players.map((n) => `<th>${escapeHtml(n)}</th>`).join("");
  const rows = state.rounds.map((round, r) =>
    `<tr><td>M${r + 1}</td>${state.players.map((_, i) =>
      `<td>${i in round ? round[i] : "–"}</td>`).join("")}</tr>`
  ).join("");
  const foot = totals().map((total) => `<td>${total}</td>`).join("");
  box.innerHTML = `<table>
    <thead><tr><th></th>${head}</tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td>Total</td>${foot}</tr></tfoot>
  </table>`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

$("toggle-history").onclick = () => $("history").classList.toggle("hidden");

$("undo").onclick = () => {
  if (!state.rounds.length) return;
  if (!confirm("Annuler la dernière manche ?")) return;
  state.rounds.pop();
  save();
  renderGame();
  checkWinner(); // re-enables "Nouvelle manche" if the game is no longer over
};

$("new-game").onclick = () => {
  if (state.rounds.length && !confirm("Abandonner la partie en cours ?")) return;
  goToSetup();
};

// ---------- Round entry sheet ----------

function openRound() {
  const t = totals();
  const box = $("round-inputs");
  box.innerHTML = "";
  $("round-title").textContent = `Manche ${state.rounds.length + 1}`;

  state.players.forEach((name, i) => {
    if (isOut(t[i])) return; // eliminated players don't play anymore

    const row = document.createElement("div");
    row.className = "round-row";
    row.innerHTML = `
      <div>
        <div class="name"></div>
        <div class="preview">${t[i]}</div>
      </div>
      <input type="text" inputmode="numeric" pattern="[0-9]*" placeholder="0" data-player="${i}">`;
    row.querySelector(".name").textContent = name;

    // Live preview: "10 → 37" so you see the new total while typing
    const input = row.querySelector("input");
    const preview = row.querySelector(".preview");
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "");
      const pts = Number(input.value) || 0;
      const next = t[i] + pts;
      preview.textContent = pts ? `${t[i]} → ${next}` : `${t[i]}`;
      preview.classList.toggle("danger", isOut(next));
      if (isOut(next)) preview.textContent += " · éliminé";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const inputs = [...box.querySelectorAll("input")];
      const next = inputs[inputs.indexOf(input) + 1];
      next ? next.focus() : saveRound();
    });
    box.appendChild(row);
  });

  $("round-sheet").classList.remove("hidden");
  box.querySelector("input").focus();
}

function saveRound() {
  const round = {};
  $("round-inputs").querySelectorAll("input").forEach((input) => {
    round[input.dataset.player] = Number(input.value) || 0; // empty = 0 points
  });
  state.rounds.push(round);
  save();
  closeRound();
  renderGame();
  checkWinner();
}

function closeRound() {
  document.activeElement.blur();
  $("round-sheet").classList.add("hidden");
}

$("open-round").onclick = openRound;
$("save-round").onclick = saveRound;
$("cancel-round").onclick = closeRound;

// ---------- Winner ----------

function checkWinner() {
  const winner = findWinner();
  const over = winner !== null;
  $("open-round").disabled = over;
  $("open-round").style.opacity = over ? 0.4 : 1;
  if (!over) return;
  $("winner-name").textContent = state.players[winner];
  $("winner").classList.remove("hidden");
}

$("replay").onclick = () => {
  state.rounds = [];
  save();
  $("winner").classList.add("hidden");
  showGame();
};
$("winner-new").onclick = () => { $("winner").classList.add("hidden"); goToSetup(); };
$("winner-close").onclick = () => $("winner").classList.add("hidden");

// ---------- Navigation ----------

function showGame() {
  $("setup").classList.add("hidden");
  $("game").classList.remove("hidden");
  $("history").classList.add("hidden");
  renderGame();
  checkWinner();
}

function goToSetup() {
  // Keep names and limit so the next game is quick to set up
  setupCount = state.players.length || 3;
  setupNames = [...state.players];
  setupMax = state.max;
  state.started = false;
  save();
  $("game").classList.add("hidden");
  $("setup").classList.remove("hidden");
  renderSetup();
}

// Resume an unfinished game, otherwise show setup
if (state.started) showGame();
else renderSetup();
