// Melee combat dice comparison and local combat history.
// Your Red is compared with the opponent's Blue.
// Your Blue is compared with the opponent's Red.

const HISTORY_KEY = "meleeCombatHistory";

const elements = {
  yourRed: document.getElementById("your-red"),
  yourBlue: document.getElementById("your-blue"),
  opponentRed: document.getElementById("opponent-red"),
  opponentBlue: document.getElementById("opponent-blue"),
  compareButton: document.getElementById("compare-button"),
  resetButton: document.getElementById("reset-button"),
  clearHistoryButton: document.getElementById("clear-history-button"),
  resultPanel: document.getElementById("result"),
  resultTitle: document.getElementById("result-title"),
  resultDescription: document.getElementById("result-description"),
  redComparison: document.getElementById("red-comparison"),
  blueComparison: document.getElementById("blue-comparison"),
  errorMessage: document.getElementById("error-message"),
  historyList: document.getElementById("history-list"),
  historyEmpty: document.getElementById("history-empty"),
  historyCount: document.getElementById("history-count")
};

function readRoll(input, label) {
  const value = input.value.trim();
  if (value === "") throw new Error(`Please enter a value for ${label}.`);

  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 8) {
    throw new Error(`${label} must be a whole number between 1 and 8.`);
  }
  return number;
}

function compareDice(yourValue, opponentValue) {
  if (yourValue > opponentValue) return "you";
  if (yourValue < opponentValue) return "opponent";
  return "tie";
}

function getCombatResult(redWinner, blueWinner) {
  if (redWinner === "you" && blueWinner === "you") {
    return { title: "Player Dominance", description: "You win two actions. Choose Red + Red, Red + Blue, or Blue + Blue." };
  }
  if (redWinner === "you" && blueWinner === "opponent") {
    return { title: "Clash", description: "Both sides get one Red action." };
  }
  if (redWinner === "opponent" && blueWinner === "you") {
    return { title: "Measure", description: "Both sides get one Blue action." };
  }
  if (redWinner === "you" && blueWinner === "tie") {
    return { title: "Player Red", description: "You get one Red action. Your opponent gets nothing." };
  }
  if (redWinner === "tie" && blueWinner === "you") {
    return { title: "Player Blue", description: "You get one Blue action. Your opponent gets nothing." };
  }
  if (redWinner === "tie" && blueWinner === "tie") {
    return { title: "No Actions", description: "Both comparisons are tied, so neither side gets an action." };
  }

  let opponentActions;
  if (redWinner === "opponent" && blueWinner === "opponent") {
    opponentActions = "two actions";
  } else if (redWinner === "opponent") {
    opponentActions = "one Blue action";
  } else {
    opponentActions = "one Red action";
  }
  return { title: "Lose", description: `You get nothing. Your opponent gets ${opponentActions}.` };
}

function describeWinner(winner, winningSide) {
  if (winner === "you") return winningSide === "red" ? "You win a Red action" : "You win a Blue action";
  if (winner === "opponent") return winningSide === "red" ? "Opponent wins a Red action" : "Opponent wins a Blue action";
  return "Tie — neither side gets this action";
}

function showComparison(container, label, yourValue, opponentValue, winner, winningSide) {
  container.replaceChildren();
  const matchup = document.createElement("span");
  matchup.textContent = `${label}: ${yourValue} vs ${opponentValue}`;
  const outcome = document.createElement("span");
  outcome.className = "comparison-outcome";
  outcome.textContent = describeWinner(winner, winningSide);
  container.append(matchup, outcome);
}

function getHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    elements.errorMessage.textContent = "The result was calculated, but this browser could not save the combat history.";
    elements.errorMessage.hidden = false;
  }
}

function addHistoryEntry(entry) {
  const history = getHistory();
  history.unshift(entry);
  // Keep the latest 100 combats so the saved list stays manageable.
  saveHistory(history.slice(0, 100));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  elements.historyList.replaceChildren();
  elements.historyCount.textContent = String(history.length);
  elements.historyEmpty.hidden = history.length > 0;

  history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const top = document.createElement("div");
    top.className = "history-item-top";

    const title = document.createElement("span");
    title.className = "history-result";
    title.textContent = entry.title;

    const time = document.createElement("time");
    time.className = "history-time";
    time.dateTime = entry.timestamp;
    time.textContent = new Date(entry.timestamp).toLocaleString();

    const rolls = document.createElement("div");
    rolls.className = "history-rolls";
    rolls.textContent = `You — Red ${entry.rolls.yourRed}, Blue ${entry.rolls.yourBlue} · Opponent — Red ${entry.rolls.opponentRed}, Blue ${entry.rolls.opponentBlue}`;

    const detail = document.createElement("div");
    detail.className = "history-detail";
    detail.textContent = entry.description;

    top.append(title, time);
    item.append(top, rolls, detail);
    elements.historyList.append(item);
  });
}

function compareRolls() {
  elements.errorMessage.hidden = true;
  elements.resultPanel.hidden = true;

  try {
    const rolls = {
      yourRed: readRoll(elements.yourRed, "Your Red"),
      yourBlue: readRoll(elements.yourBlue, "Your Blue"),
      opponentRed: readRoll(elements.opponentRed, "Opponent Red"),
      opponentBlue: readRoll(elements.opponentBlue, "Opponent Blue")
    };

    const redWinner = compareDice(rolls.yourRed, rolls.opponentBlue);
    const blueWinner = compareDice(rolls.yourBlue, rolls.opponentRed);
    const result = getCombatResult(redWinner, blueWinner);

    elements.resultTitle.textContent = result.title;
    elements.resultDescription.textContent = result.description;

    showComparison(elements.redComparison, "Red comparison (your Red vs opponent Blue)",
      rolls.yourRed, rolls.opponentBlue, redWinner, "red");
    showComparison(elements.blueComparison, "Blue comparison (your Blue vs opponent Red)",
      rolls.yourBlue, rolls.opponentRed, blueWinner, "blue");

    elements.resultPanel.hidden = false;

    addHistoryEntry({
      timestamp: new Date().toISOString(),
      rolls,
      title: result.title,
      description: result.description
    });
  } catch (error) {
    elements.errorMessage.textContent = error.message;
    elements.errorMessage.hidden = false;
  }
}

function resetCurrentRolls() {
  [elements.yourRed, elements.yourBlue, elements.opponentRed, elements.opponentBlue]
    .forEach((input) => { input.value = ""; });

  elements.resultPanel.hidden = true;
  elements.errorMessage.hidden = true;
  elements.yourRed.focus();
}

function clearHistory() {
  if (getHistory().length === 0) return;
  const confirmed = window.confirm("Clear all saved combat history from this browser?");
  if (!confirmed) return;

  try {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  } catch {
    elements.errorMessage.textContent = "This browser would not allow the saved history to be cleared.";
    elements.errorMessage.hidden = false;
  }
}

elements.compareButton.addEventListener("click", compareRolls);
elements.resetButton.addEventListener("click", resetCurrentRolls);
elements.clearHistoryButton.addEventListener("click", clearHistory);

renderHistory();
