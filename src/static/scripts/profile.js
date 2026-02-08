const userProfile = JSON.parse(document.querySelector('#sotf-mods-p').dataset.p);

const modsDiscoverContainer = document.querySelector('#mods-discover-container');

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// --- Stats ---
async function loadStats() {
    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/users/${userProfile.slug}/stats`);
        const { status, data } = await response.json();
        if (!status || !data) return;

        document.getElementById('stat-downloads-day').textContent = formatNumber(data.downloadsLastDay);
        document.getElementById('stat-downloads-7d').textContent = formatNumber(data.downloadsLast7Days);
        document.getElementById('stat-downloads-30d').textContent = formatNumber(data.downloadsLast30Days);
        document.getElementById('stat-downloads-total').textContent = formatNumber(data.totalDownloads);
        document.getElementById('stat-mods').textContent = data.modsCount;
        document.getElementById('stat-favorites').textContent = formatNumber(data.totalFavorites);
        document.getElementById('stat-reviews').textContent = data.totalReviews;
        document.getElementById('stat-rating').textContent = data.averageRating > 0
            ? data.averageRating.toFixed(1) + ' / 5'
            : '-';
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// --- Mods ---
async function getMods(approved) {
    let url = `${PUBLIC_API_URL}/api/mods?userSlug=${userProfile.slug}&limit=100&approved=${approved}`;
    const response = await fetch(url);
    const { status, data: mods, meta } = await response.json();
    if (!status) {
        throw message || _("Something went wrong");
    }
    return { mods, meta };
}

function getModTemplate(mod) {
    return `<figure class="skeleton h-[216px] overflow-hidden"><img data-lazy-src="${mod.imageUrl}" class="w-full h-full object-cover ${mod.isNSFW && !user ? 'blur-md hover:blur-none' : ''}" alt="${mod.name}"/></figure>
    <div class="card-body">
        <div class="mod-card-badges">
            <a href="/mods?category=${mod.category_slug}">
                <div class="badge badge-ghost">${mod.category.name}</div>
            </a>
            ${mod.isNSFW ? `<div class="badge badge-secondary badge-outline">NSFW</div>` : ''}
        </div>
        <h2 class="card-title w-full">${mod.name}<span class="card-title-version">${mod.latestVersion}</span></h2>
        <p>by <a class="hover-underline-animation" href="/profile/${mod.user.slug}">${mod.user.name}</a></p>
        <p class="text-justify text-wrap-anywhere">${mod.shortDescription}</p>
        <div class="card-actions justify-end">
            <a class="btn btn-outline btn-accent btn-sm" href="/mods/${mod.user.slug}/${mod.slug}">${_("See More")}</a>
        </div>
        <div class="card-actions justify-end">
            <span class="stat-desc text-accent">${mod.downloads} ${_("downloads")}</span>
            <span class="stat-desc ml-2">${timeAgo(mod.lastReleasedAt)}</span>
        </div>
    </div>`;
}

async function renderMods(mods) {
    modsDiscoverContainer.innerHTML = '';
    for (const mod of mods) {
        const modElement = document.createElement('div');
        modElement.classList.add('card', 'shadow-xl', 'card-compact', 'w-96', 'bg-base-100', 'mod-card-horizontal');
        modElement.innerHTML = getModTemplate(mod);
        modsDiscoverContainer.appendChild(modElement);
    }
    if (mods.length === 0) {
        modsDiscoverContainer.innerHTML = `<h1 class="text-center text-base-content/50">${_("No mods found")}</h1>`;
    }
}

async function loadMods() {
    modsDiscoverContainer.innerHTML = '<span class="loading loading-infinity loading-lg text-success"></span>';
    try {
        const { mods } = await getMods(false);
        mods.push(...await getMods(true).then(({ mods }) => mods));
        renderMods(mods);
    } catch (error) {
        console.error(error);
        modsDiscoverContainer.innerHTML = `<h1 class="text-center">${_("Something went wrong :(")}</h1>`;
    }
}

// --- Init ---
loadStats();
loadMods();

// --- Avatar Upload ---
document.addEventListener("DOMContentLoaded", () => {
    const imageUploadInput = document.getElementById("profile-image-upload");
    const profileImage = document.getElementById("profile-image") || document.getElementById("profile-image-placeholder");

    if (imageUploadInput) {
        profileImage.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!imageUploadInput.disabled) {
                imageUploadInput.click();
            }
        });

        imageUploadInput.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            if (!["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(file.type)) {
                showError("Invalid file type. Please upload a valid image.");
                return;
            }
            if (file.size > 8 * 1024 * 1024) {
                showError("File size exceeds 8MB. Please upload a smaller image.");
                return;
            }

            const formData = new FormData();
            formData.append("avatar", file);

            const apiUrl = window.PUBLIC_API_URL || window.location.origin;

            if (!token) {
                showError("You must be logged in to upload an avatar.");
                return;
            }

            try {
                profileImage.classList.add("opacity-50");

                const response = await fetch(`${apiUrl}/api/users/avatar`, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                    credentials: 'include',
                });

                const result = await response.json();

                if (!response.ok || !result.status) {
                    throw new Error(result?.error || "Error uploading image.");
                }

                profileImage.src = result.data.imageUrl;
                showSuccess("Avatar uploaded successfully!");
            } catch (error) {
                console.error("Avatar upload failed:", error);
                showError("Failed to upload avatar. Please try again.");
            } finally {
                profileImage.classList.remove("opacity-50");
            }
        });
    }
});
