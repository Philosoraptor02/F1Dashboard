import {
    TEAM_COLOR_MAP,
    FAV_DRIVER_KEY,
    FAV_TEAM_KEY,
    fetchJson,
    getSavedItem,
    initColorblindToggle,
} from "./shared.js";

const STANDINGS_URL = "https://api.jolpi.ca/ergast/f1/current/driverStandings.json";
const SCHEDULE_URL = "https://api.jolpi.ca/ergast/f1/current.json";

function saveFavourite(key, item) {
    localStorage.setItem(key, JSON.stringify(item));
    renderFavourites();
    updateFavouriteButtons();
}

function clearFavourite(key) {
    localStorage.removeItem(key);
    renderFavourites();
    updateFavouriteButtons();
}

function renderFavourites() {
    const container = document.querySelector("#favourites-container");
    const favDriver = getSavedItem(FAV_DRIVER_KEY);
    const favTeam = getSavedItem(FAV_TEAM_KEY);

    container.textContent = "";

    if (!favDriver && !favTeam) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No favourites saved yet. Select a driver or constructor below.";
        container.appendChild(empty);
        return;
    }

    if (favDriver) {
        container.appendChild(
            createFavCard("Favourite Driver", `${favDriver.name} (${favDriver.teamName})`, favDriver.constructorId, () =>
                clearFavourite(FAV_DRIVER_KEY)
            )
        );
    }

    if (favTeam) {
        container.appendChild(
            createFavCard("Favourite Constructor", favTeam.name, favTeam.constructorId, () =>
                clearFavourite(FAV_TEAM_KEY)
            )
        );
    }
}

function createFavCard(label, value, constructorId, onClear) {
    const card = document.createElement("div");
    card.className = "fav-card";

    const teamColor = TEAM_COLOR_MAP[constructorId];
    if (teamColor) {
        card.style.setProperty("--team-color", teamColor);
    }

    const info = document.createElement("div");
    const labelEl = document.createElement("div");
    labelEl.className = "fav-card-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    info.append(labelEl, valueEl);

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.textContent = "Remove";
    clearBtn.addEventListener("click", onClear);

    card.append(info, clearBtn);
    return card;
}

function updateFavouriteButtons() {
    const favDriver = getSavedItem(FAV_DRIVER_KEY);
    const favTeam = getSavedItem(FAV_TEAM_KEY);

    document.querySelectorAll("button[data-fav-driver]").forEach((btn) => {
        const isFav = favDriver?.driverId === btn.dataset.favDriver;
        btn.setAttribute("aria-pressed", String(isFav));
    });

    document.querySelectorAll("button[data-fav-team]").forEach((btn) => {
        const isFav = favTeam?.constructorId === btn.dataset.favTeam;
        btn.setAttribute("aria-pressed", String(isFav));
    });
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
            const btnGroup = document.createElement("div");
            btnGroup.className = "action-buttons";

            const driverName = `${entry.Driver.givenName} ${entry.Driver.familyName}`;
            const teamName = constructor?.name ?? "N/A";
            const constructorId = constructor?.constructorId ?? "";

            const favDriverBtn = document.createElement("button");
            favDriverBtn.type = "button";
            favDriverBtn.textContent = "Fav Driver";
            favDriverBtn.dataset.favDriver = entry.Driver.driverId;
            favDriverBtn.setAttribute("aria-pressed", "false");
            favDriverBtn.addEventListener("click", () => {
                saveFavourite(FAV_DRIVER_KEY, {
                    driverId: entry.Driver.driverId,
                    name: driverName,
                    teamName,
                    constructorId,
                });
            });

            const favTeamBtn = document.createElement("button");
            favTeamBtn.type = "button";
            favTeamBtn.textContent = "Fav Team";
            favTeamBtn.dataset.favTeam = constructorId;
            favTeamBtn.setAttribute("aria-pressed", "false");
            favTeamBtn.addEventListener("click", () => {
                saveFavourite(FAV_TEAM_KEY, {
                    constructorId,
                    name: teamName,
                });
            });

            btnGroup.append(favDriverBtn, favTeamBtn);
            actionTd.appendChild(btnGroup);

            tr.append(posTd, driverTd, teamTd, pointsTd, actionTd);
            tbody.appendChild(tr);
        });

        updateFavouriteButtons();
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

initColorblindToggle();
renderFavourites();

loadStandings();
loadSchedule();