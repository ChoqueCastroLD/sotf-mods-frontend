const mod = JSON.parse(document.querySelector("#sotf-mods-m").dataset.m);

const updateModBtn = document.getElementById("updateModBtn");
const releaseVersionBtn = document.getElementById("releaseVersionBtn");
const modThumbnail = document.querySelector("#mod-thumbnail");
const modImages = document.querySelector("#mod-images");

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("updated")) {
  window.history.replaceState({}, document.title, window.location.pathname);
  showSuccess(_("Congratulations! You have successfully updated your mod"));
}
if (urlParams.has("released")) {
  window.history.replaceState({}, document.title, window.location.pathname);
  showSuccess(_("Congratulations! You have successfully released your mod"));
}

document
  .getElementById("mod-update-images")
  .addEventListener("change", (event) => {
    if (event.target.checked) {
      document
        .getElementById("mod-update-images-container")
        .classList.remove("hidden");
    } else {
      document
        .getElementById("mod-update-images-container")
        .classList.add("hidden");
    }
  });
window.toggleFavorite = async function (elem, mod_id) {
  elem.disabled = true;
  document
    .getElementById("modFavorite:" + mod_id + ":off")
    .classList.toggle("hidden");
  document
    .getElementById("modFavorite:" + mod_id + ":on")
    .classList.toggle("hidden");
  const response = await fetch(
    `${PUBLIC_API_URL}/api/mods/${mod_id}/favorite`,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const { status, data } = await response.json();
  if (status) {
    if (data.favorite) {
      document
        .getElementById("modFavorite:" + mod_id + ":off")
        .classList.add("hidden");
      document
        .getElementById("modFavorite:" + mod_id + ":on")
        .classList.remove("hidden");
    } else {
      document
        .getElementById("modFavorite:" + mod_id + ":off")
        .classList.remove("hidden");
      document
        .getElementById("modFavorite:" + mod_id + ":on")
        .classList.add("hidden");
    }
    document.querySelector(
      ".follows-count"
    ).innerHTML = `${data.count} follows`;
  } else {
    console.error(
      _("There has been a problem with your fetch operation:"),
      data
    );
  }
  elem.disabled = false;
};

function renderDescriptionPreview(description) {
  const descriptionPreview = document.getElementById("mod-description-preview");
  descriptionPreview.innerHTML = markdownToHTML(description);
  document.querySelector("#mod-description-character-count").innerHTML =
    document.querySelector("#mod-description")?.value.length || "0";
}

async function main() {
  document.querySelector("#modDescriptionTemplate").innerHTML = markdownToHTML(
    mod.description
  );
  document.querySelector("#mod-description").value = mod.description;
  document
    .querySelector("#mod-description")
    ?.addEventListener("input", (event) => {
      renderDescriptionPreview(
        document.getElementById("mod-description").value
      );
    });
  renderDescriptionPreview(mod.description);
  updateModBtn.addEventListener("click", async () => {
    updateModBtn.disabled = true;
    const formData = new FormData();
    formData.append(
      "name",
      sanitizeText(document.getElementById("mod-name").value.trim())
    );
    formData.append(
      "shortDescription",
      sanitizeText(document.getElementById("mod-shortDescription").value.trim())
    );
    formData.append(
      "description",
      document.getElementById("mod-description").value.trim()
    );
    if (modThumbnail && modThumbnail.files && modThumbnail.files[0]) {
      formData.append("thumbnail", modThumbnail.files[0]);
    }
    if (document.getElementById("mod-update-images").checked) {
      for (const image of modImages.files) {
        formData.append("images", image);
      }
    }
    const response = await fetch(
      `${PUBLIC_API_URL}/api/mods/${mod.mod_id}/details`,
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: formData,
      }
    );
    const { status, message } = await response.json();
    if (status) {
      updateModBtn.classList.add("hidden");
      location.href = `/builds/${mod.user.slug}/${mod.slug}?updated=true`;
    } else {
      console.error(
        message || _("There has been a problem with your fetch operation:")
      );
      showError(message || _("There has been a problem updating the mod"));
    }
    updateModBtn.disabled = false;
  });
  releaseVersionBtn.addEventListener("click", async () => {
    releaseVersionBtn.disabled = true;
    const modChangelog = sanitizeText(
      document.getElementById("mod-changelog").value.trim()
    );
    if (!modChangelog) {
      showError(_("Please fill the changelog"));
      releaseVersionBtn.disabled = false;
      return;
    }

    const modFile = document.getElementById("mod-file");
    const formData = new FormData();
    formData.append("changelog", modChangelog);
    formData.append("modFile", modFile.files[0]);

    const response = await fetch(
      `${PUBLIC_API_URL}/api/mods/${mod.mod_id}/release`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: formData,
      }
    );
    const { status, message } = await response.json();
    if (status) {
      releaseVersionBtn.classList.add("hidden");
      location.href = `/builds/${mod.user.slug}/${mod.slug}?released=true`;
    } else {
      console.error(
        message || _("There has been a problem with your fetch operation:")
      );
      showError(message || _("There has been a problem releasing the mod"));
    }

    releaseVersionBtn.disabled = false;
  });
}

main();
