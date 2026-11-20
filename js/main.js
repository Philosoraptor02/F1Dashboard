const STANDINGS_URL = "https://api.jolpi.ca/ergast/f1/current/driverStandings.json";
const SCHEDULE_URL = "https://api.jolpi.ca/ergast/f1/current.json";
const TEAM_COLOR_MAP = {
    mercedes: "var(--team-mercedes)",
    ferrari: "var(--team-ferrari)",
    red_bull: "var(--team-red-bull)",
    mclaren: "var(--team-mclaren)",
    rb: "var(--team-racing-bulls)",
    racing_bulls: "var(--team-racing-bulls)",
    alpine: "var(--team-alpine)",
    haas: "var(--team-haas)",
    audi: "var(--team-audi)",
    sauber: "var(--team-audi)",
    williams: "var(--team-williams)",
    aston_martin: "var(--team-aston-martin)",
    cadillac: "var(--team-cadillac)",
};

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
}

async function loadStandings() {
    const loadingEl = document.querySelector("#standings-loading");
    const errorEl = document.querySelector("#standings-error");
    const loadedEl = document.querySelector("#standings-loaded");
    const tbody = document.querySelector("#standings-body");

    try {
        const data = await fetchJson(STANDINGS_URL);
        const standings = data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];

        loadingEl.classList.add("hidden");

        if (standings.length === 0) {
            errorEl.textContent = "No standings data available yet for this season.";
            errorEl.classList.remove("hidden");
            return;
        }

        tbody.textContent = "";
        standings.forEach((entry) => {
            const tr = document.createElement("tr");

            const posTd = document.createElement("td");
            posTd.textContent = entry.position;

            const driverTd = document.createElement("td");
            driverTd.textContent = `${entry.Driver.givenName} ${entry.Driver.familyName}`;

            const constructor = entry.Constructors[0];
            const teamTd = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "team-badge";
            badge.textContent = constructor?.name ?? "N/A";

            const teamColor = TEAM_COLOR_MAP[constructor?.constructorId];
            if (teamColor) {
                badge.style.setProperty("--team-color", teamColor);
            }

            teamTd.appendChild(badge);

            const pointsTd = document.createElement("td");
            pointsTd.textContent = entry.points;

            const actionTd = document.createElement("td");
            const favBtn = document.createElement("button");
            favBtn.type = "button";
            favBtn.textContent = "Favourite";
            favBtn.dataset.driverId = entry.Driver.driverId;
            actionTd.appendChild(favBtn);

            tr.append(posTd, driverTd, teamTd, pointsTd, actionTd);
            tbody.appendChild(tr);
        });

        loadedEl.classList.remove("hidden");
    } catch (err) {

        loadingEl.classList.add("hidden");
        errorEl.textContent = `Could not load standings. (${err.message})`;
        errorEl.classList.remove("hidden");
    }
}

async function loadSchedule() {
    const loadingEl = document.querySelector("#schedule-loading");
    const errorEl = document.querySelector("#schedule-error");
    const listEl = document.querySelector("#schedule-list");

    try {
        const data = await fetchJson(SCHEDULE_URL);
        const races = data.MRData.RaceTable.Races ?? [];

        loadingEl.classList.add("hidden");

        if (races.length === 0) {
            errorEl.textContent = "No races found for this season.";
            errorEl.classList.remove("hidden");
            return;
        }

        listEl.textContent = "";
        races.forEach((race) => {
            const li = document.createElement("li");

            const title = document.createElement("strong");
            title.textContent = `Round ${race.round}: ${race.raceName}`;

            const details = document.createElement("div");
            details.textContent = `${race.Circuit.circuitName} — ${race.date}`;

            li.append(title, details);
            listEl.appendChild(li);
        });

        listEl.classList.remove("hidden");
    } catch (err) {
        loadingEl.classList.add("hidden");
        errorEl.textContent = `Could not load schedule. (${err.message})`;
        errorEl.classList.remove("hidden");
    }
}

function initColorblindToggle() {
    const toggleBtn = document.querySelector("#colorblind-toggle");

    const isSavedColorblind = localStorage.getItem("colorblindMode") === "true";
    if (isSavedColorblind) {
        document.body.classList.add("colorblind");
        toggleBtn.setAttribute("aria-pressed", "true");
    }

    toggleBtn.addEventListener("click", () => {
        const isActive = document.body.classList.toggle("colorblind");
        toggleBtn.setAttribute("aria-pressed", String(isActive));
        localStorage.setItem("colorblindMode", String(isActive));
    });
}

initColorblindToggle();

loadStandings();
loadSchedule();