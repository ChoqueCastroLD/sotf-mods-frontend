const modsDiscoverContainer = document.querySelector('#mods-discover-container');
const modsDiscoverOrientation = document.querySelector('#mods-discover-orientation');
const modsDiscoverSearch = document.querySelector('#mods-discover-search');
const modsDiscoverNSFW = document.querySelector('#mods-discover-nsfw');
const modsDiscoverShowUnapproved = document.querySelector('#mods-discover-show-unapproved');
const modsDiscoverOrderBy = document.querySelector('#mods-discover-order-by');
const modsDiscoverCategories = document.querySelector('#mods-discover-categories');
const modsDiscoverPagination = document.querySelector('#mods-discover-pagination');
const modsDiscoverPaginationUP = document.querySelector('#mods-discover-pagination-up');

let forceVerticalMod = false;
let lastResponse = { mods: [], meta: {} };

function modifyQueryParam(param, value) {
    var queryParams = new URLSearchParams(window.location.search);
    if (value) queryParams.set(param, value);
    else queryParams.delete(param);
    history.replaceState(null, null, "?"+queryParams.toString());
}

function getQueryParam(param) {
    var queryParams = new URLSearchParams(window.location.search);
    return queryParams.get(param);
}

async function getMods(page) {
    const search = modsDiscoverSearch.value.trim();
    let url = `${API_URL}/api/mods?`;
    if (modsDiscoverNSFW.checked) url += '&nsfw=true';
    if (modsDiscoverShowUnapproved.checked) url += '&approved=false';
    else url += '&approved=true';
    if (modsDiscoverOrderBy.value) url += '&orderby='+modsDiscoverOrderBy.value;
    if (modsDiscoverCategories.value) url += '&category='+modsDiscoverCategories.value;
    if (search.length > 0) url += `&search=${search}`;
    if (page) {
        url += `&page=${page}`;
    }
    const response = await fetch(url);
    const { mods, meta } = await response.json();
    lastResponse = { mods, meta };
    return { mods, meta };
}

function getModTemplate(mod) {
    return `<figure><img data-lazy-src="${mod.thumbnail_url}" alt="${mod.name}" loading="lazy"/></figure>
    <div class="card-body">
        <div class="mod-card-badges">
            <a href="/mods?category=${mod.category_slug}">
                <div class="badge badge-ghost">${mod.category_name}</div>
            </a>
            ${mod.isNSFW ? `<div class="badge badge-secondary badge-outline">NSFW</div>` : ''}
            ${mod.isFeatured ? `<div class="badge badge-accent">Featured</div>` : ''}
        </div>
        <h2 class="card-title w-full">${mod.name}<span class="card-title-version">${mod.latest_version}</span></h2>
        <p>by <a class="text-accent hover-underline-animation" href="/profile/${mod.user_slug}">${mod.user_name}</a></p>
        <p class="text-justify text-wrap-anywhere">${mod.short_description}</p>
        <div class="card-actions justify-end">
            <a class="btn btn-outline ${mod.latest_version ? "btn-accent" : ""} btn-sm" href="/mods/${mod.user_slug}/${mod.slug}">See More</a>
        </div>
        <div class="card-actions justify-end">
            <span class="stat-desc text-accent">↗︎ ${mod.downloads} downloads</span>
            <span class="stat-desc text-secondary ml-2">♥ ${mod.favorites} follows</span>
            <span class="stat-desc ml-2">⏱ ${mod.time_ago}</span>
        </div>
    </div>`;
}

function buildModsPaginationPages(parentElement, {total, page, limit, next_page, prev_page, pages}) {
    parentElement.innerHTML = '';
    if(pages == 1) return;
    const pagination = document.createElement('div');
    pagination.classList.add('join');
    for (let i = 1; i <= pages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.classList.add('join-item', 'btn', 'btn-sm');
        if (i == page) {
            pageBtn.disabled = true;
            pageBtn.classList.add('btn-disabled');
        } else {
            addEventListenerDebounce(`page-${i}`, pageBtn, 'click', () => {
                loadMods(i);
                pageBtn.disabled = true;
                pageBtn.classList.add('btn-disabled');
            });
        }
        pageBtn.innerText = i;
        pagination.appendChild(pageBtn);
    }
    parentElement.appendChild(pagination);
}

async function renderMods(mods, meta) {
    const horizontalMode = modsDiscoverOrientation.checked || forceVerticalMod;
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
    buildModsPaginationPages(modsDiscoverPagination, meta);
    buildModsPaginationPages(modsDiscoverPaginationUP, meta);
}

async function loadMods(page) {
    modsDiscoverContainer.innerHTML = '<span class="loading loading-infinity loading-lg text-success center"></span>';
    modsDiscoverPagination.innerHTML = '';
    modsDiscoverPaginationUP.innerHTML = '';
    try {
        const { mods, meta } = await getMods(page);
        renderMods(mods, meta);
    } catch (error) {
        console.error(error);
        modsDiscoverPagination.innerHTML = '';
        modsDiscoverPaginationUP.innerHTML = '';
        modsDiscoverContainer.innerHTML = '<h1 class="text-center">Something went wrong :(</h1>';
    }
}

async function main() {
    if (getQueryParam('nsfw'))
        modsDiscoverNSFW.checked = getQueryParam('nsfw') === 'true';
    if (getQueryParam('showunapproved'))
        modsDiscoverShowUnapproved.checked = getQueryParam('showunapproved') === 'true';
    if (getQueryParam('orderby'))
        modsDiscoverOrderBy.value = getQueryParam('orderby');
    if (getQueryParam('category'))
        modsDiscoverCategories.value = getQueryParam('category');
    if (getQueryParam('orientation'))
        modsDiscoverOrientation.checked = getQueryParam('orientation') === 'horizontal';
    if (getQueryParam('search'))
        modsDiscoverSearch.value = getQueryParam('search') || '';

    await loadMods();
    addEventListenerDebounce('search', modsDiscoverSearch, 'input', () => {
        modifyQueryParam('search', modsDiscoverSearch.value.trim());
        loadMods();
    });
    addEventListenerDebounce('nsfw', modsDiscoverNSFW, 'change', () => {
        modifyQueryParam('nsfw', modsDiscoverNSFW.checked ? 'true' : null);
        loadMods();
    });
    addEventListenerDebounce('showunapproved', modsDiscoverShowUnapproved, 'change', () => {
        modifyQueryParam('showunapproved', modsDiscoverShowUnapproved.checked ? 'true' : null);
        loadMods();
    });
    addEventListenerDebounce('orderby', modsDiscoverOrderBy, 'change', () => {
        modifyQueryParam('orderby', modsDiscoverOrderBy.value);
        loadMods();
    });
    addEventListenerDebounce('category', modsDiscoverCategories, 'change', () => {
        modifyQueryParam('category', modsDiscoverCategories.value);
        loadMods();
    });
    addEventListenerDebounce('orientation', modsDiscoverOrientation, 'change', () => {
        modifyQueryParam('orientation', modsDiscoverOrientation.checked ? 'horizontal' : null);
        renderMods(lastResponse.mods, lastResponse.meta);
    });
    function checkWindowSize() {
        if (!forceVerticalMod && window.innerWidth < 600) {
            forceVerticalMod = true;
            loadMods();
        } else if (forceVerticalMod && window.innerWidth >= 600) {
            forceVerticalMod = false;
        }
    }
    addEventListenerDebounce('resize', window, 'resize', checkWindowSize);
    checkWindowSize();
}

main();
