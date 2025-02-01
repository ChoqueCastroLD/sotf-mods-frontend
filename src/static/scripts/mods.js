const modsDiscoverSearch = document.querySelector('#mods-discover-search');
const modsDiscoverNSFW = document.querySelector('#mods-discover-nsfw');
const modsDiscoverShowUnapproved = document.querySelector('#mods-discover-show-unapproved');
const modsDiscoverOrderBy = document.querySelector('#mods-discover-order-by');
const modsDiscoverCategories = document.querySelector('#mods-discover-categories');

function getQueryParam(param) {
    var queryParams = new URLSearchParams(window.location.search);
    return queryParams.get(param);
}

if (getQueryParam('nsfw'))
    modsDiscoverNSFW.checked = getQueryParam('nsfw') === 'true';
if (getQueryParam('showunapproved'))
    modsDiscoverShowUnapproved.checked = getQueryParam('showunapproved') === 'true';
if (getQueryParam('orderby'))
    modsDiscoverOrderBy.value = getQueryParam('orderby');
if (getQueryParam('category'))
    modsDiscoverCategories.value = getQueryParam('category');
if (getQueryParam('search'))
    modsDiscoverSearch.value = getQueryParam('search') || '';

document.querySelector('form#mods-discover-search-container')?.addEventListener('submit', (e) => {
    e.preventDefault();
    var queryParams = new URLSearchParams();
    if (modsDiscoverNSFW.checked) queryParams.set('nsfw', 'true');
    if (modsDiscoverShowUnapproved.checked) queryParams.set('showunapproved', 'true');
    else queryParams.set('showunapproved', 'false');
    if (modsDiscoverOrderBy.value) queryParams.set('orderby', modsDiscoverOrderBy.value);
    if (modsDiscoverCategories.value) queryParams.set('category', modsDiscoverCategories.value);
    const search = modsDiscoverSearch.value.trim();
    if (search.length > 0) queryParams.set('search', search);
    queryParams.set('page', "1");
    window.location.href = `/mods?${queryParams.toString()}`;
});