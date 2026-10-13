const storageKey = "un-momento-de-biblia-materiales";
const form = document.querySelector("#material-form");
const list = document.querySelector("#material-list");
const detail = document.querySelector("#material-detail");
const status = document.querySelector("#form-status");

let materials = [];

function showStatus(message, isError = false) {
  status.textContent = message;
  status.dataset.error = String(isError);
}

function loadMaterials() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.type === "string" &&
      typeof item.reference === "string" &&
      typeof item.summary === "string" &&
      typeof item.notes === "string"
    )) {
      throw new Error("Los materiales guardados tienen un formato no válido.");
    }

    return parsed;
  } catch (error) {
    showStatus("No se pudieron cargar los materiales guardados. Puedes revisar la configuración de almacenamiento del navegador.", true);
    console.error("No se pudieron cargar los materiales guardados.", error);
    return [];
  }
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function renderMaterials() {
  list.replaceChildren();

  if (materials.length === 0) {
    list.append(createTextElement("p", "empty-materials", "Aún no hay materiales. Agrega una prédica o un estudio para comenzar."));
    return;
  }

  materials.forEach((material) => {
    const card = document.createElement("article");
    card.className = "material-card";
    card.append(createTextElement("p", "card-label", material.type));
    card.append(createTextElement("h3", "", material.title));

    if (material.reference) {
      card.append(createTextElement("p", "material-reference", material.reference));
    }

    const actions = document.createElement("div");
    actions.className = "material-actions";
    const openButton = createTextElement("button", "open-material", "Explorar material");
    openButton.type = "button";
    openButton.addEventListener("click", () => {
      window.location.hash = `material-${encodeURIComponent(material.id)}`;
    });
    actions.append(openButton);

    const removeButton = createTextElement("button", "delete-material", "Eliminar");
    removeButton.type = "button";
    removeButton.addEventListener("click", () => removeMaterial(material.id));
    actions.append(removeButton);
    card.append(actions);
    list.append(card);
  });
}

function renderMaterialDetail(material) {
  detail.replaceChildren();

  const backLink = createTextElement("a", "back-to-materials", "← Volver a prédicas y estudios");
  backLink.href = "#materiales";
  detail.append(backLink);
  detail.append(createTextElement("p", "card-label", material.type));
  detail.append(createTextElement("h2", "", material.title));

  if (material.reference) {
    const reference = document.createElement("section");
    reference.className = "detail-section";
    reference.append(createTextElement("h3", "", "Pasaje bíblico"));
    reference.append(createTextElement("p", "material-reference", material.reference));
    detail.append(reference);
  }

  const teaching = document.createElement("section");
  teaching.className = "detail-section";
  teaching.append(createTextElement("h3", "", "Enseñanza principal"));
  teaching.append(createTextElement("p", "material-content", material.summary));
  detail.append(teaching);

  if (material.notes) {
    const notes = document.createElement("section");
    notes.className = "detail-section";
    notes.append(createTextElement("h3", "", "Preguntas para reflexionar y apuntes"));
    notes.append(createTextElement("p", "material-content", material.notes));
    detail.append(notes);
  }

  const removeButton = createTextElement("button", "delete-material", "Eliminar este material");
  removeButton.type = "button";
  removeButton.addEventListener("click", () => removeMaterial(material.id));
  detail.append(removeButton);
}

function renderCurrentView() {
  const materialId = window.location.hash.startsWith("#material-")
    ? decodeURIComponent(window.location.hash.slice("#material-".length))
    : null;
  const selectedMaterial = materialId
    ? materials.find((material) => material.id === materialId)
    : null;

  if (selectedMaterial) {
    form.hidden = true;
    list.hidden = true;
    detail.hidden = false;
    renderMaterialDetail(selectedMaterial);
    document.querySelector("#materiales").scrollIntoView();
    return;
  }

  detail.hidden = true;
  form.hidden = false;
  list.hidden = false;
  renderMaterials();
}

function saveMaterials(nextMaterials) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextMaterials));
    materials = nextMaterials;
    renderCurrentView();
    return true;
  } catch (error) {
    showStatus("No se pudo guardar el material. Revisa el almacenamiento disponible en tu navegador.", true);
    console.error("No se pudieron guardar los materiales.", error);
    return false;
  }
}

function removeMaterial(id) {
  const material = materials.find((item) => item.id === id);
  if (!material) return;

  const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar "${material.title}" (${material.type})? Esta acción no se puede deshacer.`);
  if (!confirmed) return;

  const nextMaterials = materials.filter((material) => material.id !== id);
  if (saveMaterials(nextMaterials)) {
    showStatus("Material eliminado.");
    if (window.location.hash === `#material-${encodeURIComponent(id)}`) {
      window.location.hash = "materiales";
    }
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const material = {
    id: crypto.randomUUID(),
    title: formData.get("title").trim(),
    type: formData.get("type"),
    reference: formData.get("reference").trim(),
    summary: formData.get("summary").trim(),
    notes: formData.get("notes").trim()
  };

  if (saveMaterials([material, ...materials])) {
    form.reset();
    showStatus("Material guardado en este navegador.");
  }
});

window.addEventListener("hashchange", renderCurrentView);

materials = loadMaterials();
renderCurrentView();
