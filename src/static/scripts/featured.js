const modsDiscoverContainer = document.querySelector('#mods-featured-container');

async function getMods() {
    let url = `${API_URL}/api/mods/featured`;
    const response = await fetch(url);
    const mods = await response.json();
    return mods;
}

function getModTemplate(mod) {
    return `<figure class="skeleton w-100 h-[216px]"><img data-lazy-src="${mod.thumbnail_url}" class="${mod.isNSFW && !user ? 'blur-md hover:blur-none' : ''}" alt="${mod.name}" loading="lazy"/></figure>
    <div class="card-body">
        <div class="mod-card-badges">
            <a href="/mods?category=${mod.category_slug}">
                <div class="badge badge-ghost">${mod.category_name}</div>
            </a>
            ${mod.isNSFW ? `<div class="badge badge-secondary badge-outline">NSFW</div>` : ''}
        </div>
        <h2 class="card-title w-full">${mod.name}<span class="card-title-version">${mod.latest_version}</span></h2>
        <p>by <a class="hover-underline-animation" href="/profile/${mod.user_slug}">${mod.user_name}</a></p>
        <p class="text-justify text-wrap-anywhere">${mod.short_description}</p>
        <div class="card-actions justify-end">
            <a class="btn btn-outline ${mod.latest_version ? "btn-accent" : ""} btn-sm" href="/mods/${mod.user_slug}/${mod.slug}">${_("See More")}</a>
        </div>
        <div class="card-actions justify-end">
            <span class="stat-desc text-accent">↗︎ ${mod.downloads} ${_("downloads")}</span>
            <span class="stat-desc ml-2">⏱ ${mod.time_ago}</span>
        </div>
    </div>`;
}

async function renderMods(mods) {
    modsDiscoverContainer.innerHTML = '';
    for (const mod of mods) {
        const modElement = document.createElement('div');
        modElement.classList.add('card', 'shadow-xl', 'my-2', 'sm:mb-2', 'sm:m-4');
        modElement.classList.add('card-compact', 'w-96', 'bg-base-100', 'mod-card-horizontal');
        modElement.innerHTML = getModTemplate(mod);
        modsDiscoverContainer.appendChild(modElement);
    }
    if (mods.length == 0) {
        modsDiscoverContainer.innerHTML = `<h1 class="text-center">${_("No mods found")}</h1>`;
    }
}

async function loadMods() {
    modsDiscoverContainer.innerHTML = '<span class="loading loading-infinity loading-lg text-success center"></span>';
    try {
        const mods = await getMods();
        renderMods(mods);
    } catch (error) {
        console.error(error);
        modsDiscoverContainer.innerHTML = `<h1 class="text-center">${_("Something went wrong")}</h1>`;
    }
}

async function main() {
    await loadMods();
}

main();
