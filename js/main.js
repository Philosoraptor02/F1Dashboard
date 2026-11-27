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

let allRaces = [];

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

        filterDrivers();
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
    const filterEl = document.querySelector("#schedule-filter");

    
    filterEl.disabled = true;

    try {
        
        const data = await fetchJson(SCHEDULE_URL);
        allRaces = data.MRData.RaceTable.Races ?? [];
        loadingEl.classList.add("hidden");
        filterEl.disabled = false;

        renderSchedule();

    } catch (err) {
        loadingEl.classList.add("hidden");
        listEl.classList.add("hidden");

        
        errorEl.textContent =`Could not load schedule. (${err.message})`;
        errorEl.classList.remove("hidden");
    }
}
function renderSchedule() {

    const filter = document.querySelector("#schedule-filter").value;
    const listEl = document.querySelector("#schedule-list");

    let racesToShow;

    if(filter === "all") {
        racesToShow = allRaces;
    }else{
        racesToShow = getUpcomingRaces(allRaces);
}
    listEl.textContent = "";
    if (racesToShow.length === 0) {

        const li = document.createElement("li");
        li.className = "empty-state";

        if (allRaces.length === 0) {
            li.textContent ="No races available this season.";
        } else {
            li.textContent = "No upcoming races remaining this season.";
        }

        listEl.appendChild(li);
        listEl.classList.remove("hidden");
        return;
    }

    racesToShow.forEach((race) => {

        const li = document.createElement("li");

        const title = document.createElement("strong");
        title.textContent =`Round ${race.round}: ${race.raceName}`;

        const circuit = document.createElement("div");
        circuit.className = "race-circuit";
        circuit.textContent = race.Circuit.circuitName;

        const date = document.createElement("div");
        date.className = "race-date";
        date.textContent = race.date;

        li.append(title, circuit, date);
        listEl.appendChild(li);
    });

    listEl.classList.remove("hidden");
}

//filters the displayed standings based on the name types in search box
function filterDrivers(){
    const driverSearch = document.querySelector("#driver-search");
    const searchText = driverSearch.value.trim().toLowerCase();

    const standingsLoaded = document.querySelector("#standings-loaded");


    if (standingsLoaded.classList.contains("hidden")){
        return;
    }
    const rows = document.querySelectorAll("#standings-body tr");
    const table = document.querySelector("#standings-table");
    const searchEmptyEl = document.querySelector("#search-empty");
    let matchingCount = 0;

    rows.forEach((row) =>{
        const driverName = row.cells[1].textContent.toLowerCase();
        const matches = driverName.includes(searchText);

        row.classList.toggle("hidden", !matches);
        if(matches){
            matchingCount++;
        }
    });

    const noMatches = rows.length > 0 && matchingCount === 0;

    table.classList.toggle("hidden", noMatches);
    searchEmptyEl.classList.toggle("hidden", !noMatches);
}

function getUpcomingRaces(races){
    const today = new Date();

    const upcomingRaces = races.filter((race) => {
        const raceDateTime = `${race.date}T${race.time ?? "23:59:59Z"}`;
        const raceDate = new Date(raceDateTime);

         if (Number.isNaN(raceDate.getTime())) {
            return false;
        }

        return raceDate > today;
    });


    upcomingRaces.sort((a, b) => {
        const dateA = new Date(
            `${a.date}T${a.time ?? "23:59:59Z"}`
        );

        const dateB = new Date(
            `${b.date}T${b.time ?? "23:59:59Z"}`
        );
        return dateA - dateB;
    });
     return upcomingRaces;
}

document.querySelector("#filter-form").addEventListener("submit", (event) => {
    event.preventDefault();
});
document.querySelector("#driver-search").addEventListener("input", filterDrivers);

document.querySelector("#schedule-filter").addEventListener("change", renderSchedule);

initColorblindToggle();
renderFavourites();

loadStandings();
loadSchedule();