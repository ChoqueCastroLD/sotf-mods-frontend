// Helper to get token (fallback if not in shared.js)
function getToken() {
  if (typeof window.getToken === 'function') {
    return window.getToken();
  }
  // Fallback implementation
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') {
      return decodeURIComponent(value);
    }
  }
  return localStorage.getItem('token') || window.token;
}

// DOM Elements
const modUploadForm = document.querySelector("#mod-upload-form");
const modFile = document.querySelector("#mod-file");
const modName = document.querySelector("#mod-name");
const modShortDescription = document.querySelector("#mod-shortDescription");
const modDescription = document.querySelector("#mod-description");
const modCategory = document.querySelector("#mod-category");
const modIsNSFW = document.querySelector("#mod-isNSFW");
const modSide = document.querySelector("#mod-side");
const modIsMultiplayerCompatible = document.querySelector("#mod-isMultiplayerCompatible");
const modRequiresAllPlayers = document.querySelector("#mod-requiresAllPlayers");
const modRequiresAllPlayersContainer = document.querySelector("#mod-requiresAllPlayers-container");
const modThumbnail = document.querySelector("#mod-thumbnail");
const modImages = document.querySelector("#mod-images");
const btnSubmitMod = document.querySelector("#btn-submit-mod");
const btnSubmitText = document.querySelector("#btn-submit-text");
const btnSubmitLoading = document.querySelector("#btn-submit-loading");
const btnCancelMod = document.querySelector("#btn-cancel-mod");

// Progress elements
const modFileProgress = document.querySelector("#mod-file-progress");
const modFileProgressBar = document.querySelector("#mod-file-progress-bar");
const modFileProgressText = document.querySelector("#mod-file-progress-text");
const modThumbnailProgress = document.querySelector("#mod-thumbnail-progress");
const modThumbnailProgressBar = document.querySelector("#mod-thumbnail-progress-bar");
const modThumbnailProgressText = document.querySelector("#mod-thumbnail-progress-text");
const modImagesProgress = document.querySelector("#mod-images-progress");
const modImagesProgressBar = document.querySelector("#mod-images-progress-bar");
const modImagesProgressText = document.querySelector("#mod-images-progress-text");

// Description tabs
const descriptionEditorTab = document.querySelector("#description-editor-tab");
const descriptionPreviewTab = document.querySelector("#description-preview-tab");
const descriptionEditorContainer = document.querySelector("#description-editor-container");
const descriptionPreviewContainer = document.querySelector("#description-preview-container");
const modDescriptionPreview = document.querySelector("#mod-description-preview");

// State
let modFileKey = null;
let isUploading = false;

// Helper: Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper: Show toast notification
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} mb-2 animate__animated animate__slideInRight`;
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      ${type === 'success' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
      ${type === 'error' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>' : ''}
      ${type === 'info' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : ''}
      <span>${message}</span>
    </div>
  `;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate__slideOutRight');
    setTimeout(() => toast.remove(), 300);
  }, type === 'error' ? 5000 : 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-4 right-4 z-50 w-96 max-w-full';
  document.body.appendChild(container);
  return container;
}

// Update character count
function updateCharacterCount() {
  const count = modDescription.value.length;
  document.querySelector("#mod-description-character-count").textContent = count;
}

// Description tab switching
descriptionEditorTab.addEventListener('click', () => {
  descriptionEditorTab.classList.add('tab-active');
  descriptionPreviewTab.classList.remove('tab-active');
  descriptionEditorContainer.classList.remove('hidden');
  descriptionPreviewContainer.classList.add('hidden');
});

descriptionPreviewTab.addEventListener('click', () => {
  descriptionPreviewTab.classList.add('tab-active');
  descriptionEditorTab.classList.remove('tab-active');
  descriptionEditorContainer.classList.add('hidden');
  descriptionPreviewContainer.classList.remove('hidden');
  renderDescriptionPreview();
});

function renderDescriptionPreview() {
  const description = modDescription.value.trim();
  modDescriptionPreview.innerHTML = markdownToHTML(description || _("No description provided."));
}

modDescription.addEventListener('input', () => {
  updateCharacterCount();
  if (descriptionPreviewTab.classList.contains('tab-active')) {
    renderDescriptionPreview();
  }
});

// Show/hide requiresAllPlayers
modIsMultiplayerCompatible.addEventListener('change', (e) => {
  if (e.target.checked) {
    modRequiresAllPlayersContainer.classList.remove('hidden');
  } else {
    modRequiresAllPlayersContainer.classList.add('hidden');
    modRequiresAllPlayers.checked = false;
  }
});

// Get presigned URL
async function getPresignedUrl(filename, contentType) {
  const res = await fetch(`${PUBLIC_API_URL}/api/files/presigned-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    credentials: 'include',
    body: JSON.stringify({ filename, contentType }),
  });
  const { status, data, message } = await res.json();
  if (!status) {
    throw new Error(message || "Failed to get upload URL");
  }
  return data;
}

// Upload file to R2 with progress tracking
function uploadFileToR2WithProgress(file, uploadUrl, progressElement, progressBar, progressText) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Show progress
    if (progressElement) {
      progressElement.classList.remove('hidden');
    }
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        if (progressBar) {
          progressBar.value = percentComplete;
        }
        if (progressText) {
          progressText.textContent = `${Math.round(percentComplete)}% (${formatFileSize(e.loaded)} / ${formatFileSize(e.total)})`;
        }
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (progressBar) progressBar.value = 100;
        if (progressText) progressText.textContent = '100%';
        setTimeout(() => {
          if (progressElement) progressElement.classList.add('hidden');
        }, 500);
        resolve();
      } else {
        if (progressElement) progressElement.classList.add('hidden');
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      if (progressElement) progressElement.classList.add('hidden');
      reject(new Error('Upload failed: Network error'));
    });
    
    xhr.addEventListener('abort', () => {
      if (progressElement) progressElement.classList.add('hidden');
      reject(new Error('Upload aborted'));
    });
    
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
}

// Handle mod file upload
modFile.addEventListener('change', async () => {
  if (!modFile.files[0]) {
    modFileKey = null;
    btnSubmitMod.disabled = true;
    return;
  }
  
  const file = modFile.files[0];
  
  // Validate file extension first
  if (!file.name.endsWith('.zip')) {
    showToast(_("Mod file must be a .zip file!"), 'error');
    modFile.value = ''; // Clear the input
    modFileKey = null;
    btnSubmitMod.disabled = true;
    return;
  }
  
  // Check file size limit based on user permissions
  // Default to 200MB if user info is not loaded yet
  const isTrusted = window.user?.isTrusted === true;
  const fileSizeLimit = (isTrusted ? 500 : 200) * 1024 * 1024;
  const fileSizeLimitMB = isTrusted ? 500 : 200;
  
  if (file.size > fileSizeLimit) {
    showToast(_(`Mod file must be less than ${fileSizeLimitMB}MB!`), 'error');
    modFile.value = ''; // Clear the input
    modFileKey = null;
    btnSubmitMod.disabled = true;
    return;
  }
  
  try {
    showToast(_("Preparing mod file upload..."), 'info');
    
    // Get presigned URL
    const modFilePresigned = await getPresignedUrl(
      file.name,
      file.type || "application/zip"
    );
    
    // Upload with progress
    await uploadFileToR2WithProgress(
      file,
      modFilePresigned.uploadUrl,
      modFileProgress,
      modFileProgressBar,
      modFileProgressText
    );
    
    modFileKey = modFilePresigned.fileKey;
    showToast(_("Mod file uploaded successfully!"), 'success');
    
    // Read manifest
    const response = await fetch(`${PUBLIC_API_URL}/api/mods/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify({ modFileKey: modFilePresigned.fileKey }),
    });
    
    const r = await response.json();
    if (!r.status) {
      throw new Error(r.message || r.error || _("Failed to read mod manifest"));
    }
    
    // Auto-fill form
    if (r.data.name && !modName.value) modName.value = r.data.name;
    const modVersionInput = document.querySelector('#mod-version');
    if (r.data.version && modVersionInput) modVersionInput.setAttribute('value', r.data.version);
    if (r.data.description && !modShortDescription.value) modShortDescription.value = r.data.description;
    
    showToast(_("Mod information loaded from manifest!"), 'success');
    updateCharacterCount();
  } catch (err) {
    console.error(err);
    showToast(err.message || _("Failed to upload mod file"), 'error');
    modFileKey = null;
    modFile.value = '';
    btnSubmitMod.disabled = true;
  }
});

// Validation
function validateMod() {
  const errors = [];
  
  if (!modFile.files[0]) errors.push(_("Mod file is required!"));
  
  // Check file size limit based on user permissions
  // Default to 200MB if user info is not loaded yet
  if (modFile.files[0]) {
    const isTrusted = window.user?.isTrusted === true;
    const fileSizeLimit = (isTrusted ? 500 : 200) * 1024 * 1024;
    const fileSizeLimitMB = isTrusted ? 500 : 200;
    if (modFile.files[0].size > fileSizeLimit) {
      errors.push(_(`Mod file must be less than ${fileSizeLimitMB}MB!`));
    }
  }
  
  if (!modName.value.trim()) errors.push(_("Mod name is required!"));
  if (modName.value.trim().length < 3) errors.push(_("Mod name must be at least 3 characters!"));
  if (modName.value.trim().length > 64) errors.push(_("Mod name must be less than 64 characters!"));
  if (!modShortDescription.value.trim()) errors.push(_("Short description is required!"));
  if (modShortDescription.value.trim().length < 3) errors.push(_("Short description must be at least 3 characters!"));
  if (modShortDescription.value.trim().length > 200) errors.push(_("Short description must be less than 200 characters!"));
  if (!modDescription.value.trim()) errors.push(_("Description is required!"));
  if (modDescription.value.trim().length < 3) errors.push(_("Description must be at least 3 characters!"));
  if (modDescription.value.trim().length > 2000) errors.push(_("Description must be less than 2000 characters!"));
  if (!modCategory.value) errors.push(_("Category is required!"));
  if (!modThumbnail.files[0]) errors.push(_("Thumbnail is required!"));
  
  if (modThumbnail.files[0]) {
    const thumbExt = modThumbnail.files[0].name.substring(modThumbnail.files[0].name.lastIndexOf('.'));
    if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(thumbExt.toLowerCase())) {
      errors.push(_("Thumbnail must be an image file!"));
    }
    if (modThumbnail.files[0].size > 8 * 1024 * 1024) {
      errors.push(_("Thumbnail must be less than 8MB!"));
    }
  }
  
  if (modImages.files.length > 5) {
    errors.push(_("Maximum 5 images allowed!"));
  }
  
  for (const file of [...modImages.files]) {
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext.toLowerCase())) {
      errors.push(_("All images must be image files!"));
      break;
    }
    if (file.size > 8 * 1024 * 1024) {
      errors.push(_("Each image must be less than 8MB!"));
      break;
    }
  }
  
  return errors;
}

// Main upload function
async function uploadMod() {
  if (isUploading) return;
  
  const errors = validateMod();
  if (errors.length > 0) {
    errors.forEach(err => showToast(err, 'error'));
    return;
  }
  
  isUploading = true;
  btnSubmitMod.disabled = true;
  btnSubmitText.textContent = _("Uploading...");
  btnSubmitLoading.classList.remove('hidden');
  
  try {
    const mod = {
      name: modName.value.trim(),
      shortDescription: modShortDescription.value.trim(),
      description: modDescription.value.trim(),
      isNSFW: modIsNSFW.checked,
      category_id: parseInt(modCategory.value),
      modSide: modSide.value || null,
      isMultiplayerCompatible: modIsMultiplayerCompatible.checked,
      requiresAllPlayers: modRequiresAllPlayers.checked,
    };
    
    showToast(_("Starting upload process..."), 'info');
    
    // Upload thumbnail
    showToast(_("Uploading thumbnail..."), 'info');
    const thumbnailPresigned = await getPresignedUrl(
      modThumbnail.files[0].name,
      modThumbnail.files[0].type || "image/png"
    );
    await uploadFileToR2WithProgress(
      modThumbnail.files[0],
      thumbnailPresigned.uploadUrl,
      modThumbnailProgress,
      modThumbnailProgressBar,
      modThumbnailProgressText
    );
    
    // Upload images
    const imageFiles = [...modImages.files];
    const imagePresignedUrls = [];
    
    if (imageFiles.length > 0) {
      showToast(_("Preparing image uploads..."), 'info');
      for (const image of imageFiles) {
        const presigned = await getPresignedUrl(
          image.name,
          image.type || "image/png"
        );
        imagePresignedUrls.push(presigned);
      }
      
      showToast(_("Uploading images..."), 'info');
      modImagesProgress.classList.remove('hidden');
      
      for (let i = 0; i < imageFiles.length; i++) {
        modImagesProgressText.textContent = `${i + 1} / ${imageFiles.length}`;
        modImagesProgressBar.value = (i / imageFiles.length) * 100;
        await uploadFileToR2WithProgress(
          imageFiles[i],
          imagePresignedUrls[i].uploadUrl,
          null,
          null,
          null
        );
      }
      
      modImagesProgressBar.value = 100;
      modImagesProgressText.textContent = `${imageFiles.length} / ${imageFiles.length}`;
      setTimeout(() => modImagesProgress.classList.add('hidden'), 500);
    }
    
    // Publish mod
    showToast(_("Publishing mod..."), 'info');
    const res = await fetch(`${PUBLIC_API_URL}/api/mods/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        name: sanitizeText(mod.name),
        shortDescription: sanitizeText(mod.shortDescription),
        description: mod.description,
        isNSFW: mod.isNSFW,
        category_id: mod.category_id,
        modFileKey: modFileKey,
        thumbnailKey: thumbnailPresigned.fileKey,
        imageKeys: imagePresignedUrls.map((p) => p.fileKey),
        modSide: mod.modSide,
        isMultiplayerCompatible: mod.isMultiplayerCompatible,
        requiresAllPlayers: mod.requiresAllPlayers,
      }),
    });
    
    const { status, message } = await res.json();
    if (!status) {
      throw new Error(message || _("Failed to publish mod"));
    }
    
    showToast(_("Mod uploaded successfully! Redirecting..."), 'success');
    setTimeout(() => {
      window.location.href = `/profile/${user.slug}?mod-uploaded=true`;
    }, 1500);
    
  } catch (error) {
    console.error(error);
    showToast(error.message || _("Upload failed. Please try again."), 'error');
    isUploading = false;
    btnSubmitMod.disabled = false;
    btnSubmitText.textContent = _("upload.Submit");
    btnSubmitLoading.classList.add('hidden');
  }
}

// Form submission
modUploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await uploadMod();
});

// Cancel button
btnCancelMod.addEventListener('click', () => {
  if (confirm(_("Are you sure you want to cancel? All unsaved changes will be lost."))) {
    window.location.href = '/mods';
  }
});

// Enable submit when mod file is uploaded
function checkFormValidity() {
  const hasModFile = modFileKey !== null;
  const hasName = modName.value.trim().length >= 3;
  const hasShortDesc = modShortDescription.value.trim().length >= 3;
  const hasDesc = modDescription.value.trim().length >= 3;
  const hasCategory = modCategory.value !== '';
  const hasThumbnail = modThumbnail.files.length > 0;
  
  btnSubmitMod.disabled = !(hasModFile && hasName && hasShortDesc && hasDesc && hasCategory && hasThumbnail && !isUploading);
}

modName.addEventListener('input', checkFormValidity);
modShortDescription.addEventListener('input', checkFormValidity);
modDescription.addEventListener('input', checkFormValidity);
modCategory.addEventListener('change', checkFormValidity);
modThumbnail.addEventListener('change', checkFormValidity);

// Initialize
updateCharacterCount();
checkFormValidity();
