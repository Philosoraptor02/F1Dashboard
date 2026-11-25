export const FAV_DRIVER_KEY = "favouriteDriver";
export const FAV_TEAM_KEY = "favouriteConstructor";

export const TEAM_COLOR_MAP = {
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

export async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
}

export function getSavedItem(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        return null;
    }
}

export function initColorblindToggle() {
    const toggleBtn = document.querySelector("#colorblind-toggle");
    if (!toggleBtn) return;

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