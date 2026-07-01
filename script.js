const state = {
  characters: [],
  filteredCharacters: [],
  selectedId: null
};

const elements = {
  searchInput: document.querySelector("#searchInput"),
  raceFilter: document.querySelector("#raceFilter"),
  homeFilter: document.querySelector("#homeFilter"),
  gameFilter: document.querySelector("#gameFilter"),
  roleFilter: document.querySelector("#roleFilter"),
  originFilter: document.querySelector("#originFilter"),
  eraFilter: document.querySelector("#eraFilter"),
  shipFilter: document.querySelector("#shipFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  clearFilters: document.querySelector("#clearFilters"),
  characterList: document.querySelector("#characterList"),
  resultCount: document.querySelector("#resultCount"),
  characterImage: document.querySelector("#characterImage"),
  imageFallback: document.querySelector("#imageFallback"),
  characterNumber: document.querySelector("#characterNumber"),
  characterName: document.querySelector("#characterName"),
  characterTitle: document.querySelector("#characterTitle"),
  characterRace: document.querySelector("#characterRace"),
  characterHome: document.querySelector("#characterHome"),
  characterGame: document.querySelector("#characterGame"),
  characterRole: document.querySelector("#characterRole"),
  characterOrigin: document.querySelector("#characterOrigin"),
  characterEra: document.querySelector("#characterEra"),
  characterShips: document.querySelector("#characterShips"),
  characterNotes: document.querySelector("#characterNotes")
};

async function loadCharacters() {
  const response = await fetch("data/characters.json");
  const data = await response.json();
  state.characters = normalizeCharacters(data);
  state.selectedId = state.characters[0]?.id ?? null;
  buildFilters();
  bindEvents();
  applyFilters();
}

function normalizeCharacters(data) {
  const entries = Array.isArray(data) ? data : data.characters;

  return entries.map((entry, index) => {
    if (!Array.isArray(entry)) {
      return entry;
    }

    const [
      name,
      race,
      home,
      firstGame,
      stageRole,
      originType,
      era,
      ships = [],
      notes = ""
    ] = entry;
    const id = slugify(name);

    return {
      id,
      appearanceOrder: index + 1,
      name,
      title: race,
      image: `character-images/${id}.png`,
      race,
      home,
      firstGame,
      stageRole,
      originType,
      era,
      ships,
      notes
    };
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\((.*?)\)/g, "-$1")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function bindEvents() {
  [
    elements.searchInput,
    elements.raceFilter,
    elements.homeFilter,
    elements.gameFilter,
    elements.roleFilter,
    elements.originFilter,
    elements.eraFilter,
    elements.shipFilter,
    elements.sortSelect
  ].forEach((control) => control.addEventListener("input", applyFilters));

  elements.clearFilters.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.raceFilter.value = "all";
    elements.homeFilter.value = "all";
    elements.gameFilter.value = "all";
    elements.roleFilter.value = "all";
    elements.originFilter.value = "all";
    elements.eraFilter.value = "all";
    elements.shipFilter.value = "all";
    elements.sortSelect.value = "appearance";
    applyFilters();
  });
}

function buildFilters() {
  fillSelect(elements.raceFilter, uniqueValues("race"), "All races");
  fillSelect(elements.homeFilter, uniqueValues("home"), "All homes");
  fillSelect(elements.gameFilter, uniqueValues("firstGame"), "All games");
  fillSelect(elements.roleFilter, uniqueValues("stageRole"), "All roles");
  fillSelect(elements.originFilter, uniqueValues("originType"), "All origin types");
  fillSelect(elements.eraFilter, uniqueValues("era"), "All eras");
  fillSelect(elements.shipFilter, uniqueArrayValues("ships"), "All ships");
}

function uniqueValues(key) {
  return [...new Set(state.characters.map((character) => character[key]))].sort();
}

function uniqueArrayValues(key) {
  return [...new Set(state.characters.flatMap((character) => character[key]))].sort();
}

function fillSelect(select, values, label) {
  select.innerHTML = `<option value="all">${label}</option>`;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filters = {
    race: elements.raceFilter.value,
    home: elements.homeFilter.value,
    firstGame: elements.gameFilter.value,
    stageRole: elements.roleFilter.value,
    originType: elements.originFilter.value,
    era: elements.eraFilter.value,
    ship: elements.shipFilter.value
  };

  state.filteredCharacters = state.characters
    .filter((character) => matchesQuery(character, query))
    .filter((character) => matchesFilter(character.race, filters.race))
    .filter((character) => matchesFilter(character.home, filters.home))
    .filter((character) => matchesFilter(character.firstGame, filters.firstGame))
    .filter((character) => matchesFilter(character.stageRole, filters.stageRole))
    .filter((character) => matchesFilter(character.originType, filters.originType))
    .filter((character) => matchesFilter(character.era, filters.era))
    .filter((character) => filters.ship === "all" || character.ships.includes(filters.ship));

  sortCharacters();

  if (!state.filteredCharacters.some((character) => character.id === state.selectedId)) {
    state.selectedId = state.filteredCharacters[0]?.id ?? null;
  }

  renderList();
  renderSelectedCharacter();
}

function matchesQuery(character, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    character.name,
    character.title,
    character.race,
    character.home,
    character.firstGame,
    character.stageRole,
    character.originType,
    character.era,
    ...character.ships
  ].join(" ").toLowerCase();

  return haystack.includes(query);
}

function matchesFilter(value, filterValue) {
  return filterValue === "all" || value === filterValue;
}

function sortCharacters() {
  const sortMode = elements.sortSelect.value;

  state.filteredCharacters.sort((a, b) => {
    if (sortMode === "name") {
      return a.name.localeCompare(b.name);
    }

    return a.appearanceOrder - b.appearanceOrder;
  });
}

function renderList() {
  elements.resultCount.textContent = state.filteredCharacters.length;
  elements.characterList.innerHTML = "";

  if (state.filteredCharacters.length === 0) {
    elements.characterList.innerHTML = `<div class="empty-state">No matching characters.</div>`;
    return;
  }

  state.filteredCharacters.forEach((character) => {
    const row = document.createElement("button");
    row.className = `character-row${character.id === state.selectedId ? " active" : ""}`;
    row.type = "button";
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", String(character.id === state.selectedId));
    row.innerHTML = `
      <span class="row-number">#${String(character.appearanceOrder).padStart(2, "0")}</span>
      <span class="row-main">
        <span class="row-name">${character.name}</span>
        <span class="row-meta">${character.race} / ${character.firstGame}</span>
      </span>
      <span class="row-era">${character.era}</span>
    `;

    row.addEventListener("click", () => {
      state.selectedId = character.id;
      renderList();
      renderSelectedCharacter();
    });

    elements.characterList.appendChild(row);
  });
}

function renderSelectedCharacter() {
  const character = state.characters.find((item) => item.id === state.selectedId);

  if (!character) {
    elements.characterNumber.textContent = "";
    elements.characterName.textContent = "No character selected";
    elements.characterTitle.textContent = "Try clearing filters or searching again.";
    elements.characterImage.removeAttribute("src");
    elements.characterImage.style.display = "none";
    elements.imageFallback.textContent = "No result";
    elements.imageFallback.style.display = "grid";
    clearDetails();
    return;
  }

  elements.characterImage.src = character.image;
  elements.characterImage.alt = character.name;
  elements.characterImage.style.display = "block";
  elements.imageFallback.textContent = character.image;

  elements.characterImage.onload = () => {
    elements.characterImage.style.display = "block";
    elements.imageFallback.style.display = "none";
  };

  elements.characterImage.onerror = () => {
    elements.characterImage.style.display = "none";
    elements.imageFallback.style.display = "grid";
  };

  elements.characterNumber.textContent = `#${String(character.appearanceOrder).padStart(2, "0")}`;
  elements.characterName.textContent = character.name;
  elements.characterTitle.textContent = character.title;
  elements.characterRace.textContent = character.race;
  elements.characterHome.textContent = character.home;
  elements.characterGame.textContent = character.firstGame;
  elements.characterRole.textContent = character.stageRole;
  elements.characterOrigin.textContent = character.originType;
  elements.characterEra.textContent = character.era;
  elements.characterNotes.textContent = character.notes;
  elements.characterShips.innerHTML = "";

  character.ships.forEach((ship) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = ship;
    elements.characterShips.appendChild(chip);
  });
}

function clearDetails() {
  elements.characterRace.textContent = "-";
  elements.characterHome.textContent = "-";
  elements.characterGame.textContent = "-";
  elements.characterRole.textContent = "-";
  elements.characterOrigin.textContent = "-";
  elements.characterEra.textContent = "-";
  elements.characterShips.innerHTML = "";
  elements.characterNotes.textContent = "";
}

loadCharacters().catch(() => {
  elements.characterList.innerHTML = `<div class="empty-state">Could not load data/characters.json. Use a local server so fetch can read the JSON file.</div>`;
});
