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
  console.log({ elem, mod_id });
  const isFavorite = elem.checked;
  const response = await fetch(
    `${PUBLIC_API_URL}/api/favorites/toggle`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modId: mod_id,
        favorite: isFavorite,
      }),
    }
  );
  const { data } = await response.json();
  if (data?.count !== undefined) { 
    if (document.querySelector(".follows-count-" + mod_id)) {
      document.querySelector(".follows-count-" + mod_id).innerHTML = `${data.count}`;
    }
    if (document.querySelector(".following-tooltip-" + mod_id)) {
      if (isFavorite) {
        document.querySelector(".following-tooltip-" + mod_id).dataset.tip = data.count + " " + _("following") + _(" with me");
      } else {
        document.querySelector(".following-tooltip-" + mod_id).dataset.tip = data.count + " " + _("following");
      }
    }
  }
  elem.disabled = false;
};

window.approve = async function (elem) {
  elem.disabled = true;
  const response = await fetch(
    `${PUBLIC_API_URL}/api/mods/${mod.mod_id}/approve`,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const { status, message } = await response.json();
  if (status) {
    location.href = `/mods/${mod.user.slug}/${mod.slug}`;
  } else {
    console.error(
      message || _("There has been a problem with your fetch operation:")
    );
    showError(message || _("There has been a problem approving the mod"));
  }
  elem.disabled = false;
};

window.unapprove = async function (elem) {
  elem.disabled = true;
  const response = await fetch(
    `${PUBLIC_API_URL}/api/mods/${mod.mod_id}/unapprove`,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const { status, message } = await response.json();
  if (status) {
    location.href = `/mods/${mod.user.slug}/${mod.slug}`;
  } else {
    console.error(
      message || _("There has been a problem with your fetch operation:")
    );
    showError(message || _("There has been a problem unapproving the mod"));
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
    formData.append("isNSFW", document.getElementById("mod-isNSFW").checked);
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
      location.href = `/mods/${mod.user.slug}/${mod.slug}?updated=true`;
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
      location.href = `/mods/${mod.user.slug}/${mod.slug}?released=true`;
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

document.addEventListener("DOMContentLoaded", () => {
  const mainModImages = [...document.querySelectorAll(".mod-main-image")];
  const modThumbnailImages = [...document.querySelectorAll(".mod-image")];

  modThumbnailImages.forEach((image) => {
    image.addEventListener("click", (event) => {
      event.preventDefault();
      mainModImages.forEach((mainModImage) => {
        if (
          mainModImage.dataset.modImageIndex === image.dataset.modImageIndex
        ) {
          mainModImage.classList.remove("hidden");
        } else {
          mainModImage.classList.add("hidden");
        }
      });
    });
  });
});
