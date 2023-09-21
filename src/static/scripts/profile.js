const userProfile = JSON.parse(atob(document.querySelector('#sotf-mods-p').dataset.p));

const modsDiscoverContainer = document.querySelector('#mods-discover-container');

let forceVerticalMod = false;

async function getMods() {
    let url = `${API_URL}/api/mods?user_slug=${userProfile.slug}&approved=false`;
    const response = await fetch(url);
    const mods = await response.json();
    const meta = {
        total: response.headers.get('X-Total-Count'),
        page: response.headers.get('X-Page'),
        limit: response.headers.get('X-Limit'),
        pages: response.headers.get('X-Pages'),
        next_page: response.headers.get('X-Next-Page'),
        prev_page: response.headers.get('X-Prev-Page'),
    }
    return { mods, meta };
}

function getModTemplate(mod) {
    return `<figure><img data-lazy-src="${mod.thumbnail_url}" alt="${mod.name}"/></figure>
    <div class="card-body">
        <div class="mod-card-badges">
            <a href="/mods?category=${mod.category_slug}">
                <div class="badge badge-ghost">${mod.category_name}</div>
            </a>
            ${mod.isNSFW ? `<div class="badge badge-secondary badge-outline">NSFW</div>` : ''}
            ${mod.isFeatured ? `<div class="badge badge-accent">Featured</div>` : ''}
        </div>
        <h2 class="card-title w-full">${mod.name}<span class="card-title-version">${mod.latest_version}</span></h2>
        <p>by <a class="text-success hover-underline-animation" href="/profile/${mod.user_slug}">${mod.user_name}</a></p>
        <p class="text-justify text-wrap-anywhere">${mod.short_description}</p>
        <div class="card-actions justify-end">
            <a class="btn btn-outline btn-success btn-sm" href="/mods/${mod.user_slug}/${mod.slug}">See More</a>
        </div>
        <div class="card-actions justify-end">
            <span class="stat-desc text-success">↗︎ ${mod.downloads} downloads</span>
            <span class="stat-desc text-secondary ml-2">♥ ${mod.favorites} follows</span>
            <span class="stat-desc ml-2">⏱ ${mod.time_ago}</span>
        </div>
    </div>`;
}

async function renderMods(mods, meta) {
    const horizontalMode = forceVerticalMod;
    modsDiscoverContainer.innerHTML = '';
    for (const mod of mods) {
        const modElement = document.createElement('div');
        modElement.classList.add('card', 'shadow-xl', 'sm:mb-2', 'mb-4');
        if (horizontalMode) {
            modElement.classList.add('card-compact', 'w-96', 'bg-base-100', 'mod-card-horizontal');
        } else {
            modElement.classList.add('card-side', 'bg-base-100', 'mod-card');
        }
        modElement.innerHTML = getModTemplate(mod);
        modsDiscoverContainer.appendChild(modElement);
    }
    if (mods.length == 0) {
        modsDiscoverContainer.innerHTML = '<h1 class="text-center">No mods found</h1>';
    }
}

async function loadMods() {
    modsDiscoverContainer.innerHTML = '<span class="loading loading-infinity loading-lg text-success center"></span>';
    try {
        const { mods, meta } = await getMods();
        renderMods(mods, meta);
    } catch (error) {
        console.error(error);
        modsDiscoverContainer.innerHTML = '<h1 class="text-center">Something went wrong :(</h1>';
    }
}


async function main() {
    await loadMods();
    function checkWindowSize() {
        let startForceVerticalMod = forceVerticalMod;
        if (window.innerWidth < 600) {
            forceVerticalMod = true;
        } else if (forceVerticalMod && window.innerWidth >= 600) {
            forceVerticalMod = false;
        }
        if (startForceVerticalMod != forceVerticalMod) {
            loadMods();
        }
    }
    addEventListenerDebounce('resize', window, 'resize', checkWindowSize);
    checkWindowSize();
}

main();