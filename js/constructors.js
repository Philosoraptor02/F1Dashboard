import {
    FAV_TEAM_KEY,
    TEAM_COLOR_MAP,
    fetchJson,
    getSavedItem,
    initColorblindToggle,
} from "./shared.js";

const CONSTRUCTORS_URL = "https://api.jolpi.ca/ergast/f1/current/constructorstandings.json";

async function loadConstructors() {
    const loadingEl = document.querySelector("#constructors-loading");
    const errorEl = document.querySelector("#constructors-error");
    const loadedEl = document.querySelector("#constructors-loaded");
    const tbody = document.querySelector("#constructors-body");

    try {
        const data = await fetchJson(CONSTRUCTORS_URL);
        const standings = data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];

        loadingEl.classList.add("hidden");

        if (standings.length === 0) {
            errorEl.textContent = "No constructor standings available yet for this season.";
            errorEl.classList.remove("hidden");
            return;
        }

        const favTeam = getSavedItem(FAV_TEAM_KEY);
        tbody.textContent = "";

        standings.forEach((entry) => {
            const tr = document.createElement("tr");
            const constructor = entry.Constructor;

            if (favTeam?.constructorId === constructor.constructorId) {
                tr.classList.add("fav-row");
            }

            const posTd = document.createElement("td");
            posTd.textContent = entry.position;

            const teamTd = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "team-badge";
            badge.textContent = constructor.name;

            const teamColor = TEAM_COLOR_MAP[constructor.constructorId];
            if (teamColor) {
                badge.style.setProperty("--team-color", teamColor);
            }
            teamTd.appendChild(badge);

            const natTd = document.createElement("td");
            natTd.textContent = constructor.nationality ?? "N/A";

            const winsTd = document.createElement("td");
            winsTd.textContent = entry.wins;

            const pointsTd = document.createElement("td");
            pointsTd.textContent = entry.points;

            tr.append(posTd, teamTd, natTd, winsTd, pointsTd);
            tbody.appendChild(tr);
        });

        loadedEl.classList.remove("hidden");
    } catch (err) {
        loadingEl.classList.add("hidden");
        errorEl.textContent = `Could not load constructor standings. (${err.message})`;
        errorEl.classList.remove("hidden");
    }
}

initColorblindToggle();
loadConstructors();