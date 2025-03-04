const modListDemo = document.querySelector("#build-list-demo");

const modBasicInformation = document.querySelector("#build-basic-information");

const btnSubmitMod = document.querySelector("#btn-submit-build");
const modName = document.querySelector("#build-name");
const modShortDescription = document.querySelector("#build-shortDescription");
const modDescription = document.querySelector("#build-description");
const modCategory = document.querySelector("#build-category");
const modFile = document.querySelector("#build-file");
const modThumbnail = document.querySelector("#build-thumbnail");
const modImages = document.querySelector("#build-images");

function getModTemplate(mod) {
  if (!mod.shortDescription)
    mod.shortDescription = _("This is a description of the mod.");
  return `<figure class="skeleton w-100 h-[216px]"><img data-lazy-src="${
    mod.imageUrl || "https://files.sotf-mods.com/download/thumbnail.png"
  }" class="${mod.isNSFW && !user ? "blur-md hover:blur-none" : ""}" alt="${
    mod.name || _("Mod Name")
  }"/></figure>
    <div class="card-body">
        <div class="mod-card-badges">
            <a href="#!">
                <div class="badge badge-ghost">${
                  parseInt(modCategory.value)
                    ? modCategory.selectedOptions[0]?.innerText
                    : _("Category")
                }</div>
            </a>
            ${
              mod.isNSFW
                ? `<div class="badge badge-secondary badge-outline">NSFW</div>`
                : ""
            }
        </div>
        <h2 class="card-title w-full">${
          mod.name || "Mod Name"
        }<span class="card-title-version">${
    (mod.latestVersion && mod.latestVersion.version) || ""
  }</span></h2>
        <p class="text-left">by <a class="hover-underline-animation" href="#!">${
          user.name
        }</a></p>
        <p class="text-justify text-wrap-anywhere">${mod.shortDescription}</p>
        <div class="card-actions justify-end">
            <a class="btn btn-outline btn-accent btn-sm" href="#!">${_(
              "See More"
            )}</a>
        </div>
        <div class="card-actions justify-end">
            <span class="stat-desc text-accent">↗︎ 99 ${_("downloads")}</span>
            <span class="stat-desc ml-2">⏱ ${_("just released")}</span>
        </div>
    </div>`;
}

async function renderModItem() {
  const mod = getMod();
  modListDemo.innerHTML = "";
  const modElement = document.createElement("div");
  modElement.classList.add(
    "card",
    "card-compact",
    "w-96",
    "bg-base-100",
    "shadow-xl",
    "mod-card-horizontal"
  );
  modElement.innerHTML = getModTemplate(mod);
  modListDemo.appendChild(modElement);
}

function getMod() {
  return {
    name: modName.value.trim(),
    shortDescription: modShortDescription.value.trim(),
    description: modDescription.value.trim(),
    imageUrl:
      modThumbnail?.files?.length > 0
        ? URL.createObjectURL(modThumbnail.files[0])
        : null,
    category_id: parseInt(modCategory.value) || null,
  };
}

function validateMod(mod) {
  if (!modFile.files[0]) throw _("Build file is required!");
  if (!modFile.files[0].name.endsWith(".json"))
    throw _("Build file must be a .json file!");
  if (modFile.files[0].size > 100 * 1024 * 1024)
    throw _("Build file must be less than 100MB!");
  if (!mod.name) throw _("Build name is required!");
  if (mod.name.length < 3)
    throw _("Build name must be at least 3 characters long!");
  if (mod.name.length > 64)
    throw _("Build name must be less than 64 characters!");
  if (!mod.shortDescription) throw _("Build short description is required!");
  if (mod.shortDescription.length < 3)
    throw _("Build short description must be at least 3 characters long!");
  if (mod.shortDescription.length > 200)
    throw _("Build short description must be less than 200 characters!");
  if (!mod.description) throw _("Build description is required!");
  if (mod.description.length < 3)
    throw _("Build description must be at least 3 characters long!");
  if (mod.description.length > 2000)
    throw _("Build description must be less than 2000 characters!");
  if (!mod.category_id) throw _("Build category is required!");
  if (isNaN(mod.category_id)) throw _("Build category is not valid!");
  if (!modThumbnail.files[0]) throw _("Build thumbnail is required!");
  if (
    ![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(
      modThumbnail.files[0].name.substring(
        modThumbnail.files[0].name.lastIndexOf(".")
      )
    )
  )

    throw _("Build thumbnail must be a .png, .jpg, .jpeg, .webp or .gif file!");
  if (modThumbnail.files[0].size > 8 * 1024 * 1024)
    throw _("Build thumbnail must be less than 8MB!");
  if ([...modImages.files].length > 5)
    throw _("Build images must be less than 5 files!");
  for (const file of [...modImages.files]) {
    if (
      ![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(
        file.name.substring(file.name.lastIndexOf("."))
      )
    )
      throw _("Build images must be a .png, .jpg, .jpeg, .webp or .gif file!");
    if (file.size > 8 * 1024 * 1024)
      throw _("Build images must be less than 8MB!");
  }
  return true;
}

async function uploadMod() {
  btnSubmitMod.classList.add("btn-disabled");
  btnSubmitMod.disabled = true;
  try {
    const mod = getMod();

    validateMod(mod);

    const formData = new FormData();

    formData.append("name", mod.name);
    formData.append("shortDescription", mod.shortDescription);
    formData.append("description", sanitizeText(mod.description));
    formData.append("category_id", mod.category_id);
    formData.append("buildFile", modFile.files[0]);
    formData.append("thumbnail", modThumbnail.files[0]);
    for (const image of modImages.files) {
      formData.append("images", image);
    }

    const res = await fetch(`${PUBLIC_API_URL}/api/builds/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const { status, message } = await res.json();
    if (status) {
      window.location.href = `/profile/${user.slug}?build-uploaded=true`;
      return;
    }
    throw message || _("Something went wrong");
  } catch (error) {
    console.log(error);
    showError(error);
  } finally {
    btnSubmitMod.classList.remove("btn-disabled");
    btnSubmitMod.disabled = false;
  }
}

function renderDescriptionPreview() {
  const description = document.getElementById("mod-description").value.trim();
  const descriptionPreview = document.getElementById("mod-description-preview");
  descriptionPreview.innerHTML = markdownToHTML(description);
  document.querySelector("#mod-description-character-count").innerHTML =
    document.querySelector("#mod-description")?.value.length || "0";
}

async function main() {
  modDescription.addEventListener("input", renderDescriptionPreview);
  modCategory.addEventListener("change", renderModItem);
  modThumbnail.addEventListener("change", renderModItem);
  modFile.addEventListener("change", () => {
    const formData = new FormData();
    formData.append("buildFile", modFile.files[0]);
    fetch(PUBLIC_API_URL + "/api/builds/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((r) => r.json())
      .then((r) => {
        if (!r.status) {
          throw r.message || r.error;
        }
        modName.value = r.data.name;
        modShortDescription.value = r.data.shortDescription;
        modBasicInformation.classList.remove("hidden");
        btnSubmitMod.disabled = false;
        renderModItem();
      })
      .catch((err) => {
        console.error(err);
        showError(err);
      });
  });

  btnSubmitMod.addEventListener("click", (evt) => {
    evt.preventDefault();
    uploadMod();
  });
}

main();
