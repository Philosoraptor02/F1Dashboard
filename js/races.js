import {
    TEAM_COLOR_MAP,
    fetchJson,
    initColorblindToggle,
} from "./shared.js";

const SCHEDULE_URL = "https://api.jolpi.ca/ergast/f1/current.json";

const raceSelect = document.querySelector("#race-select");
const headingEl = document.querySelector("#race-results-heading");
const loadingEl = document.querySelector("#race-loading");
const errorEl = document.querySelector("#race-error");
const loadedEl = document.querySelector("#race-loaded");
const tbody = document.querySelector("#race-results-body");

async function loadRaceList() {
    try {
        const data = await fetchJson(SCHEDULE_URL);
        const races = data.MRData.RaceTable.Races ?? [];

        raceSelect.textContent = "";

        if (races.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "No races available";
            raceSelect.appendChild(opt);
            return;
        }

        races.forEach((race) => {
            const opt = document.createElement("option");
            opt.value = race.round;
            opt.textContent = `Round ${race.round}: ${race.raceName}`;
            raceSelect.appendChild(opt);
        });

        raceSelect.disabled = false;
    } catch (err) {
        raceSelect.textContent = "";
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Could not load race list";
        raceSelect.appendChild(opt);
    }
}

async function loadRaceResults(round = "last") {
    loadingEl.classList.remove("hidden");
    errorEl.classList.add("hidden");
    loadedEl.classList.add("hidden");

    const url = `https://api.jolpi.ca/ergast/f1/current/${round}/results.json`;

    try {
        const data = await fetchJson(url);
        const race = data.MRData.RaceTable.Races[0];
        const results = race?.Results ?? [];

        loadingEl.classList.add("hidden");

        if (!race || results.length === 0) {
            headingEl.textContent = "Race Results";
            errorEl.textContent = "No results available yet for this round.";
            errorEl.classList.remove("hidden");
            return;
        }

        headingEl.textContent = `Round ${race.round}: ${race.raceName} (${race.date})`;

        // Sync dropdown if loaded via "last"
        if (raceSelect.querySelector(`option[value="${race.round}"]`)) {
            raceSelect.value = race.round;
        }

        tbody.textContent = "";
        results.forEach((entry) => {
            const tr = document.createElement("tr");

            const posTd = document.createElement("td");
            posTd.textContent = entry.position;

            const driverTd = document.createElement("td");
            driverTd.textContent = `${entry.Driver.givenName} ${entry.Driver.familyName}`;

            const constructor = entry.Constructor;
            const teamTd = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "team-badge";
            badge.textContent = constructor?.name ?? "N/A";

            const teamColor = TEAM_COLOR_MAP[constructor?.constructorId];
            if (teamColor) {
                badge.style.setProperty("--team-color", teamColor);
            }
            teamTd.appendChild(badge);

            const gridTd = document.createElement("td");
            gridTd.textContent = entry.grid;

            const statusTd = document.createElement("td");
            statusTd.textContent = entry.Time?.time ?? entry.status;

            const pointsTd = document.createElement("td");
            pointsTd.textContent = entry.points;

            tr.append(posTd, driverTd, teamTd, gridTd, statusTd, pointsTd);
            tbody.appendChild(tr);
        });

        loadedEl.classList.remove("hidden");
    } catch (err) {
        loadingEl.classList.add("hidden");
        errorEl.textContent = `Could not load race results. (${err.message})`;
        errorEl.classList.remove("hidden");
    }
}

raceSelect.addEventListener("change", (e) => {
    if (e.target.value) {
        loadRaceResults(e.target.value);
    }
});

initColorblindToggle();
loadRaceList();
loadRaceResults("last");