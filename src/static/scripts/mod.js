const mod = JSON.parse(atob(document.querySelector('#sotf-mods-m').dataset.m));

const btnOneClickInstall = document.getElementById('btnOneClickInstall');
const modalOneClickInstall = document.getElementById('modalOneClickInstall');
const updateModBtn = document.getElementById('updateModBtn');
const releaseVersionBtn = document.getElementById('releaseVersionBtn');
const modThumbnail = document.querySelector('#mod-thumbnail');

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('updated')) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showSuccess("Congratulations! You have successfully updated your mod");
}
if (urlParams.has('released')) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showSuccess("Congratulations! You have successfully released your mod");
}

window.toggleFavorite = async function (elem, author, slug) {
    elem.disabled = true;
    const response = await fetch(`${API_URL}/api/mods/${author}/${slug}/favorite`, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    const data = await response.json();
    if (response.ok) {
        if (data.favorite) {
            document.getElementById("modFavorite:" + slug + ":off").classList.add("hidden");
            document.getElementById("modFavorite:" + slug + ":on").classList.remove("hidden");
        } else {
            document.getElementById("modFavorite:" + slug + ":off").classList.remove("hidden");
            document.getElementById("modFavorite:" + slug + ":on").classList.add("hidden");
        }
    } else {
        console.error('There has been a problem with your fetch operation:', data);
    }
    elem.disabled = false;
}

window.approve = async function (elem) {
    elem.disabled = true;
    const response = await fetch(`${API_URL}/api/mods/${mod.user_slug}/${mod.slug}/approve`, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    const data = await response.json();
    if (response.ok) {
        location.href = `/mods/${mod.user_slug}/${mod.slug}`;
    } else {
        console.error('There has been a problem with your fetch operation:', data);
        showError("There has been a problem approving the mod");
    }
    elem.disabled = false;
}

function renderDescriptionPreview(description) {
    const descriptionPreview = document.getElementById('mod-description-preview');
    descriptionPreview.innerHTML = markdownToHTML(description);
    document.querySelector('#mod-description-character-count').innerHTML = document.querySelector('#mod-description')?.value.length || "0";
}

async function main() {
    document.querySelector('#modDescriptionTemplate').innerHTML = markdownToHTML(mod.description);
    document.querySelector('#mod-description').value = mod.description;
    btnOneClickInstall.addEventListener('click', () => {
        openModal('#modalOneClickInstall');
    });
    document.querySelector('#mod-description')?.addEventListener('input', (event) => {
        renderDescriptionPreview(document.getElementById('mod-description').value);
    });
    renderDescriptionPreview(mod.description);
    updateModBtn.addEventListener('click', async () => {
        showLoadingScreen();
        updateModBtn.disabled = true;
        const formData = new FormData();
        formData.append('name', sanitizeText(document.getElementById('mod-name').value.trim()));
        formData.append('shortDescription', sanitizeText(document.getElementById('mod-shortDescription').value.trim()));
        formData.append('description', document.getElementById('mod-description').value.trim());
        formData.append('isNSFW', document.getElementById('mod-isNSFW').checked);
        if(modThumbnail && modThumbnail.files && modThumbnail.files[0]) {
            formData.append('modThumbnail', modThumbnail.files[0]);
        }
        const response = await fetch(`${API_URL}/api/mods/${mod.user_slug}/${mod.slug}/details`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
            body: formData  
        })
        const data = await response.json();
        if (response.ok) {
            updateModBtn.classList.add('hidden');
            location.href = `/mods/${mod.user_slug}/${mod.slug}?updated=true`;
        } else {
            console.error('There has been a problem with your fetch operation:', data);
            showError(data.error);
        }
        updateModBtn.disabled = false;
        hideLoadingScreen();
    });
    releaseVersionBtn.addEventListener('click', async () => {
        showLoadingScreen();
        releaseVersionBtn.disabled = true;
        const modChangelog = sanitizeText(document.getElementById('mod-changelog').value.trim());
        if (!modChangelog) {
            showError('Please fill the changelog');
            releaseVersionBtn.disabled = false;
            hideLoadingScreen();
            return;
        }
        
        const modFile = document.getElementById('mod-file');
        const formData = new FormData();
        formData.append('changelog', modChangelog);
        formData.append('modFile', modFile.files[0]);

        const response = await fetch(`${API_URL}/api/mods/${mod.user_slug}/${mod.slug}/release`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
            body: formData,
        });
        const data = await response.json();
        if (response.ok) {
            releaseVersionBtn.classList.add('hidden');
            location.href = `/mods/${mod.user_slug}/${mod.slug}?released=true`;
        } else {
            console.error('There has been a problem with your fetch operation:', data);
            showError(data.error);
        }
        releaseVersionBtn.disabled = false;
        hideLoadingScreen();
    });
}

main();
