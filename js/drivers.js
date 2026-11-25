import {
    FAV_DRIVER_KEY,
    fetchJson,
    getSavedItem,
    initColorblindToggle,
} from "./shared.js";

const DRIVERS_URL = "https://api.jolpi.ca/ergast/f1/current/drivers.json";

const driverSelect = document.querySelector("#driver-select");
const bioHeading = document.querySelector("#driver-bio-heading");
const bioCard = document.querySelector("#driver-bio-card");
const loadingEl = document.querySelector("#driver-loading");
const errorEl = document.querySelector("#driver-error");
const loadedEl = document.querySelector("#driver-loaded");
const tbody = document.querySelector("#driver-results-body");

let driversById = new Map();

function createBioStat(label, value) {
    const stat = document.createElement("div");
    stat.className = "bio-stat";

    const labelEl = document.createElement("div");
    labelEl.className = "bio-stat-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("div");
    valueEl.className = "bio-stat-value";
    valueEl.textContent = value;

    stat.append(labelEl, valueEl);
    return stat;
}

function renderBio(driver) {
    bioHeading.textContent = `${driver.givenName} ${driver.familyName}`;
    bioCard.textContent = "";

    bioCard.append(
        createBioStat("Number", driver.permanentNumber ? `#${driver.permanentNumber}` : "N/A"),
        createBioStat("Code", driver.code ?? "N/A"),
        createBioStat("Nationality", driver.nationality ?? "N/A"),
        createBioStat("Date of Birth", driver.dateOfBirth ?? "N/A")
    );
}

async function loadDriverResults(driverId) {
    loadingEl.classList.remove("hidden");
    errorEl.classList.add("hidden");
    loadedEl.classList.add("hidden");

    const url = `https://api.jolpi.ca/ergast/f1/current/drivers/${driverId}/results.json`;

    try {
        const data = await fetchJson(url);
        const races = data.MRData.RaceTable.Races ?? [];

        loadingEl.classList.add("hidden");

        if (races.length === 0) {
            errorEl.textContent = "No race results found for this driver yet.";
            errorEl.classList.remove("hidden");
            return;
        }

        tbody.textContent = "";
        races.forEach((race) => {
            const result = race.Results[0];
            if (!result) return;

            const tr = document.createElement("tr");

            const roundTd = document.createElement("td");
            roundTd.textContent = race.round;

            const raceTd = document.createElement("td");
            raceTd.textContent = race.raceName;

            const gridTd = document.createElement("td");
            gridTd.textContent = result.grid;

            const finishTd = document.createElement("td");
            finishTd.textContent = result.position;

            const pointsTd = document.createElement("td");
            pointsTd.textContent = result.points;

            const statusTd = document.createElement("td");
            statusTd.textContent = result.Time?.time ?? result.status;

            tr.append(roundTd, raceTd, gridTd, finishTd, pointsTd, statusTd);
            tbody.appendChild(tr);
        });

        loadedEl.classList.remove("hidden");
    } catch (err) {
        loadingEl.classList.add("hidden");
        errorEl.textContent = `Could not load driver results. (${err.message})`;
        errorEl.classList.remove("hidden");
    }
}

async function loadDrivers() {
    try {
        const data = await fetchJson(DRIVERS_URL);
        const drivers = data.MRData.DriverTable.Drivers ?? [];

        drivers.sort((a, b) => a.familyName.localeCompare(b.familyName));

        driverSelect.textContent = "";
        driversById.clear();

        if (drivers.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "No drivers available";
            driverSelect.appendChild(opt);
            return;
        }

        drivers.forEach((driver) => {
            driversById.set(driver.driverId, driver);
            const opt = document.createElement("option");
            opt.value = driver.driverId;
            opt.textContent = `${driver.givenName} ${driver.familyName}`;
            driverSelect.appendChild(opt);
        });

        driverSelect.disabled = false;

        // Default to saved favourite driver if present, otherwise first driver
        const favDriver = getSavedItem(FAV_DRIVER_KEY);
        const initialId = driversById.has(favDriver?.driverId)
            ? favDriver.driverId
            : drivers[0].driverId;

        driverSelect.value = initialId;
        renderBio(driversById.get(initialId));
        loadDriverResults(initialId);
    } catch (err) {
        loadingEl.classList.add("hidden");
        errorEl.textContent = `Could not load drivers list. (${err.message})`;
        errorEl.classList.remove("hidden");
    }
}

driverSelect.addEventListener("change", (e) => {
    const driver = driversById.get(e.target.value);
    if (driver) {
        renderBio(driver);
        loadDriverResults(driver.driverId);
    }
});

initColorblindToggle();
loadDrivers();