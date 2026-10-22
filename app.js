const STORAGE_KEY = "together-plans-v1";
const form = document.querySelector("#activity-form");
const titleInput = document.querySelector("#activity-title");
const categoryInput = document.querySelector("#activity-category");
const timeInput = document.querySelector("#activity-time");
const errorBox = document.querySelector("#form-error");
const list = document.querySelector("#activity-list");
const emptyState = document.querySelector("#empty-state");
const count = document.querySelector("#activity-count");

let activities = loadActivities();

function loadActivities() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(item =>
      item && typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.category === "string" &&
      typeof item.time === "string" &&
      typeof item.done === "boolean"
    ) : [];
  } catch {
    return [];
  }
}

function saveActivities() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    return true;
  } catch {
    errorBox.textContent = "Your browser could not save this plan. Check storage settings and try again.";
    return false;
  }
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not set";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit"
  }).format(date);
}

function render() {
  list.replaceChildren();
  emptyState.hidden = activities.length > 0;
  count.textContent = `${activities.length} ${activities.length === 1 ? "plan" : "plans"}`;

  for (const activity of activities) {
    const item = document.createElement("article");
    item.className = `activity-item${activity.done ? " done" : ""}`;

    const complete = document.createElement("button");
    complete.type = "button";
    complete.className = "check-button";
    complete.setAttribute("aria-label", activity.done ? "Mark as not done" : "Mark as done");
    complete.textContent = activity.done ? "✓" : "";
    complete.addEventListener("click", () => {
      activity.done = !activity.done;
      if (saveActivities()) render();
    });

    const copy = document.createElement("div");
    copy.className = "activity-copy";
    const title = document.createElement("div");
    title.className = "activity-title";
    title.textContent = activity.title;
    const meta = document.createElement("div");
    meta.className = "activity-meta";
    const category = document.createElement("span");
    category.className = "category";
    category.textContent = activity.category;
    const when = document.createElement("span");
    when.textContent = formatTime(activity.time);
    meta.append(category, when);
    copy.append(title, meta);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${activity.title}`);
    remove.addEventListener("click", () => {
      activities = activities.filter(entry => entry.id !== activity.id);
      if (saveActivities()) render();
    });

    item.append(complete, copy, remove);
    list.append(item);
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  errorBox.textContent = "";
  const title = titleInput.value.trim();
  const time = timeInput.value;
  if (!title) {
    errorBox.textContent = "Please enter an activity name.";
    titleInput.focus();
    return;
  }
  if (!time || Number.isNaN(new Date(time).getTime())) {
    errorBox.textContent = "Please choose a valid date and time.";
    timeInput.focus();
    return;
  }
  if (new Date(time).getTime() < Date.now() - 60_000) {
    errorBox.textContent = "Choose a future time for your plan.";
    timeInput.focus();
    return;
  }

  const activity = {
    id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    category: categoryInput.value,
    time,
    done: false
  };
  activities.unshift(activity);
  if (saveActivities()) {
    form.reset();
    render();
    titleInput.focus();
  } else {
    activities.shift();
  }
});

render();
