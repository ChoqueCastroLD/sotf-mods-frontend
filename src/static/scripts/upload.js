const modListDemo = document.querySelector("#mod-list-demo");

const modBasicInformation = document.querySelector("#mod-basic-information");

const btnSubmitMod = document.querySelector("#btn-submit-mod");
const modName = document.querySelector("#mod-name");
const modShortDescription = document.querySelector("#mod-shortDescription");
const modDescription = document.querySelector("#mod-description");
const modCategory = document.querySelector("#mod-category");
const modVersion = document.querySelector("#mod-version");
const modIsNSFW = document.querySelector("#mod-isNSFW");
const modSide = document.querySelector("#mod-side");
const modIsMultiplayerCompatible = document.querySelector("#mod-isMultiplayerCompatible");
const modRequiresAllPlayers = document.querySelector("#mod-requiresAllPlayers");
const modRequiresAllPlayersContainer = document.querySelector("#mod-requiresAllPlayers-container");
const modFile = document.querySelector("#mod-file");
const modThumbnail = document.querySelector("#mod-thumbnail");
const modImages = document.querySelector("#mod-images");

// Store the mod file key after initial upload
let modFileKey = null;

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
    (mod.latestVersion && mod.latestVersion.version) || "1.0.0"
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
    isNSFW: modIsNSFW.checked,
    category_id: parseInt(modCategory.value) || null,
    version: modVersion.value.trim(),
    modSide: document.getElementById('mod-side')?.value || null,
    isMultiplayerCompatible: modIsMultiplayerCompatible?.checked || false,
    requiresAllPlayers: modRequiresAllPlayers?.checked || false,
  };
}

function isVersionValid(version) {
  const regex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return regex.test(version);
}

function validateMod(mod) {
  if (!modFile.files[0]) throw _("Mod file is required!");
  if (!modFile.files[0].name.endsWith(".zip"))
    throw _("Mod file must be a .zip file!");
  if (modFile.files[0].size > 200 * 1024 * 1024)
    throw _("Mod file must be less than 200MB!");
  if (!mod.name) throw _("Mod name is required!");
  if (mod.name.length < 3)
    throw _("Mod name must be at least 3 characters long!");
  if (mod.name.length > 64)
    throw _("Mod name must be less than 64 characters!");
  if (!mod.shortDescription) throw _("Mod short description is required!");
  if (mod.shortDescription.length < 3)
    throw _("Mod short description must be at least 3 characters long!");
  if (mod.shortDescription.length > 200)
    throw _("Mod short description must be less than 200 characters!");
  if (!mod.description) throw _("Mod description is required!");
  if (mod.description.length < 3)
    throw _("Mod description must be at least 3 characters long!");
  if (mod.description.length > 2000)
    throw _("Mod description must be less than 2000 characters!");
  if (!mod.category_id) throw _("Mod category is required!");
  if (isNaN(mod.category_id)) throw _("Mod category is not valid!");
  if (!mod.version) throw _("Mod version is required!");
  if (!isVersionValid(mod.version))
    throw _("Mod version is not valid! (must follow format x.x.x)");
  if (!modThumbnail.files[0]) throw _("Mod thumbnail is required!");
  if (
    ![".zip", ".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(
      modThumbnail.files[0].name.substring(
        modThumbnail.files[0].name.lastIndexOf(".")
      )
    )
  )
    throw _("Mod thumbnail must be a .png, .jpg, .jpeg, .webp or .gif file!");
  if (modThumbnail.files[0].size > 8 * 1024 * 1024)
    throw _("Mod thumbnail must be less than 8MB!");
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

async function getPresignedUrl(filename, contentType) {
  const res = await fetch(`${PUBLIC_API_URL}/api/files/presigned-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename, contentType }),
  });
  const { status, data, message } = await res.json();
  if (!status) {
    throw new Error(message || "Failed to get upload URL");
  }
  return data;
}

async function uploadFileToR2(file, uploadUrl) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to upload file: ${res.statusText}`);
  }
}

async function uploadMod() {
  btnSubmitMod.classList.add("btn-disabled");
  btnSubmitMod.disabled = true;
  try {
    const mod = getMod();

    validateMod(mod);

    // Check if mod file was already uploaded (when file was selected)
    if (!modFileKey) {
      // Get presigned URL for mod file if not already uploaded
      const modFilePresigned = await getPresignedUrl(
        modFile.files[0].name,
        modFile.files[0].type || "application/zip"
      );
      await uploadFileToR2(modFile.files[0], modFilePresigned.uploadUrl);
      modFileKey = modFilePresigned.fileKey;
    }

    // Get presigned URLs for thumbnail and images
    const thumbnailPresigned = await getPresignedUrl(
      modThumbnail.files[0].name,
      modThumbnail.files[0].type || "image/png"
    );

    const imagePresignedUrls = await Promise.all(
      [...modImages.files].map(async (image) => {
        const presigned = await getPresignedUrl(
          image.name,
          image.type || "image/png"
        );
        return presigned;
      })
    );

    // Upload thumbnail and images directly to R2
    await Promise.all([
      uploadFileToR2(modThumbnail.files[0], thumbnailPresigned.uploadUrl),
      ...modImages.files.map((image, index) =>
        uploadFileToR2(image, imagePresignedUrls[index].uploadUrl)
      ),
    ]);

    // Now publish with file keys
    const res = await fetch(`${PUBLIC_API_URL}/api/mods/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: sanitizeText(mod.name),
        shortDescription: sanitizeText(mod.shortDescription),
        description: mod.description,
        isNSFW: mod.isNSFW,
        category_id: mod.category_id,
        modFileKey: modFileKey,
        thumbnailKey: thumbnailPresigned.fileKey,
        imageKeys: imagePresignedUrls.map((p) => p.fileKey),
        modSide: mod.modSide || null,
        isMultiplayerCompatible: mod.isMultiplayerCompatible,
        requiresAllPlayers: mod.requiresAllPlayers,
      }),
    });
    const { status, message } = await res.json();
    if (status) {
      window.location.href = `/profile/${user.slug}?mod-uploaded=true`;
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
  await renderModItem();
  modName.addEventListener("input", renderModItem);
  modShortDescription.addEventListener("input", renderModItem);
  modDescription.addEventListener("input", renderDescriptionPreview);
  modCategory.addEventListener("change", renderModItem);
  modIsNSFW.addEventListener("change", renderModItem);
  modThumbnail.addEventListener("change", renderModItem);
  
  // Show/hide requiresAllPlayers based on isMultiplayerCompatible
  if (modIsMultiplayerCompatible) {
    modIsMultiplayerCompatible.addEventListener("change", (e) => {
      if (e.target.checked) {
        modRequiresAllPlayersContainer.classList.remove("hidden");
      } else {
        modRequiresAllPlayersContainer.classList.add("hidden");
        if (modRequiresAllPlayers) {
          modRequiresAllPlayers.checked = false;
        }
      }
      renderModItem();
    });
  }
  modFile.addEventListener("change", async () => {
    try {
      if (!modFile.files[0]) {
        modFileKey = null;
        return;
      }
      
      // Get presigned URL for mod file
      const modFilePresigned = await getPresignedUrl(
        modFile.files[0].name,
        modFile.files[0].type || "application/zip"
      );
      
      // Upload file to R2
      await uploadFileToR2(modFile.files[0], modFilePresigned.uploadUrl);
      
      // Store the file key for later use
      modFileKey = modFilePresigned.fileKey;
      
      // Now call API to read manifest
      const response = await fetch(PUBLIC_API_URL + "/api/mods/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modFileKey: modFilePresigned.fileKey,
        }),
      });
      
      const r = await response.json();
      if (!r.status) {
        throw r.message || r.error;
      }
      modName.value = r.data.name;
      modVersion.value = r.data.version;
      modShortDescription.value = r.data.description;
      modBasicInformation.classList.remove("hidden");
      btnSubmitMod.disabled = false;
      renderModItem();
    } catch (err) {
      console.error(err);
      showError(err);
      modFileKey = null;
    }
  });

  btnSubmitMod.addEventListener("click", (evt) => {
    evt.preventDefault();
    uploadMod();
  });
}

main();
