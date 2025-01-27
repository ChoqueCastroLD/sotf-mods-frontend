const mod = JSON.parse(atob(document.querySelector('#sotf-mods-m').dataset.m));

const btnOneClickInstall = document.getElementById('btnOneClickInstall');
const modalOneClickInstall = document.getElementById('modalOneClickInstall');
const updateModBtn = document.getElementById('updateModBtn');
const releaseVersionBtn = document.getElementById('releaseVersionBtn');
const modThumbnail = document.querySelector('#mod-thumbnail');

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('updated')) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showSuccess(_("Congratulations! You have successfully updated your mod"));
}
if (urlParams.has('released')) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showSuccess(_("Congratulations! You have successfully released your mod"));
}

window.toggleFavorite = async function (elem, mod_id) {
    elem.disabled = true;
    document.getElementById("modFavorite:" + mod_id + ":off").classList.toggle("hidden");
    document.getElementById("modFavorite:" + mod_id + ":on").classList.toggle("hidden");
    const response = await fetch(`${PUBLIC_API_URL}/api/mods/${mod_id}/favorite`, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    const data = await response.json();
    if (response.ok) {
        if (data.favorite) {
            document.getElementById("modFavorite:" + mod_id + ":off").classList.add("hidden");
            document.getElementById("modFavorite:" + mod_id + ":on").classList.remove("hidden");
        } else {
            document.getElementById("modFavorite:" + mod_id + ":off").classList.remove("hidden");
            document.getElementById("modFavorite:" + mod_id + ":on").classList.add("hidden");
        }
        document.querySelector('.follows-count').innerHTML = `${data.count} follows`;
    } else {
        console.error(_('There has been a problem with your fetch operation:'), data);
    }
    elem.disabled = false;
}

window.approve = async function (elem) {
    elem.disabled = true;
    const response = await fetch(`${PUBLIC_API_URL}/api/mods/${mod.mod_id}/approve`, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    const data = await response.json();
    if (response.ok) {
        location.href = `/mods/${mod.user_slug}/${mod.slug}`;
    } else {
        console.error(_('There has been a problem with your fetch operation:'), data);
        showError(_("There has been a problem approving the mod"));
    }
    elem.disabled = false;
}

window.unapprove = async function (elem) {
    elem.disabled = true;
    const response = await fetch(`${PUBLIC_API_URL}/api/mods/${mod.mod_id}/unapprove`, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    const data = await response.json();
    if (response.ok) {
        location.href = `/mods/${mod.user_slug}/${mod.slug}`;
    } else {
        console.error(_('There has been a problem with your fetch operation:'), data);
        showError(_("There has been a problem unapproving the mod"));
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
        const showModal = localStorage.getItem('one-click-modal') !== 'false';
        if (showModal) {
            openModal('#modalOneClickInstall');
        } else {
            window.location.href = `sotf-mods-oneclick://?mod_id=${encodeURIComponent(mod.mod_id)}&user_slug=${encodeURIComponent(mod.user_slug)}&slug=${encodeURIComponent(mod.slug)}&version=${encodeURIComponent(mod.latest_version)}&type=${encodeURIComponent(mod.type)}&`;
        }
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
        const response = await fetch(`${PUBLIC_API_URL}/api/mods/${mod.mod_id}/details`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
            body: formData  
        })
        const data = await response.json();
        if (data.status) {
            updateModBtn.classList.add('hidden');
            location.href = `/mods/${mod.user_slug}/${mod.slug}?updated=true`;
        } else {
            console.error(_('There has been a problem with your fetch operation:'), data);
            showError(data.message || data.error);
        }
        updateModBtn.disabled = false;
        hideLoadingScreen();
    });
    releaseVersionBtn.addEventListener('click', async () => {
        showLoadingScreen();
        releaseVersionBtn.disabled = true;
        const modChangelog = sanitizeText(document.getElementById('mod-changelog').value.trim());
        if (!modChangelog) {
            showError(_('Please fill the changelog'));
            releaseVersionBtn.disabled = false;
            hideLoadingScreen();
            return;
        }
        
        const modFile = document.getElementById('mod-file');
        const formData = new FormData();
        formData.append('changelog', modChangelog);
        formData.append('modFile', modFile.files[0]);

        const response = await fetch(`${PUBLIC_API_URL}/api/mods/${mod.mod_id}/release`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
            body: formData,
        });
        const data = await response.json();
        if (data.status) {
            releaseVersionBtn.classList.add('hidden');
            location.href = `/mods/${mod.user_slug}/${mod.slug}?released=true`;
        } else {
            console.error(_('There has been a problem with your fetch operation:'), data);
            showError(data.message || data.error);
        }
        releaseVersionBtn.disabled = false;
        hideLoadingScreen();
    });
}

main();
