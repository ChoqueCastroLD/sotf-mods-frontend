const loadingScreen = document.querySelector('#loading-screen');

window.user = document.querySelector('#sotf-mods-u') && JSON.parse(atob(document.querySelector('#sotf-mods-u').dataset.u));
window.token = document.querySelector('#sotf-mods-t') && JSON.parse(atob(document.querySelector('#sotf-mods-t').dataset.t));
window.PUBLIC_API_URL = document.querySelector('#sotf-mods-a') && JSON.parse(atob(document.querySelector('#sotf-mods-a').dataset.a));
window.translations = document.querySelector('#sotf-mods-l') && JSON.parse(document.querySelector('#sotf-mods-l').dataset.l);

window.timeAgo = (date, locale = navigator.language) => {
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        if (diffInSeconds >= secondsInUnit) {
            const diff = Math.floor(diffInSeconds / secondsInUnit);
            return formatter.format(-diff, unit);
        }
    }

    return formatter.format(0, 'second'); // "just now" or equivalent
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-time-ago]').forEach(element => {
        element.textContent = timeAgo(new Date(element.dataset.timeAgo));
    });
});

window.redirectWithParams = (newParams = "") => {
    const url = new URL(window.location);
    if (newParams) {
        const params = new URLSearchParams(newParams);
        for (const [key, value] of params.entries()) {
            url.searchParams.set(key, value);
        }
    }
    window.location.href = url.toString();
}

window._ = (key) => {
    return window.translations[key] || key;
}

window.showLoadingScreen = () => {
    loadingScreen.showModal();
    loadingScreen.style.display = 'flex';
}
window.hideLoadingScreen = () => {
    loadingScreen.close();
    loadingScreen.style.display = 'none';
}
window.openModal = (modalSelector) => {
    document.querySelector(modalSelector).classList.add('modal-open');
}
window.closeModal = (modalSelector) => {
    document.querySelector(modalSelector).classList.remove('modal-open');
}
window.errorTimeout = null;
window.showError = error => {
    document.querySelector('#alert-wrapper').style.display = 'flex';
    document.querySelector('#alerts').classList.add('animate__backInRight');
    document.querySelector('#alerts').innerHTML = `
    <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>${_("Error!")} ${error?.message || error?.error || error || _("Something went wrong!")}</span>
    </div>`;
    clearTimeout(window.errorTimeout);
    window.errorTimeout = setTimeout(() => {
        document.querySelector('#alerts').classList.add('animate__backOutRight');
        setTimeout(() => {
            document.querySelector('#alerts').innerHTML = '';
            document.querySelector('#alerts').classList.remove('animate__backOutRight');
            document.querySelector('#alerts').classList.remove('animate__backInRight');
            document.querySelector('#alert-wrapper').style.display = 'none';
            // document.querySelector('#alert-wrapper').close();
        }, 800);
    }, 15000);
};
window.successTimeout = null;
window.showSuccess = message => {
    document.querySelector('#alert-wrapper').style.display = 'flex';
    document.querySelector('#alerts').classList.add('animate__backInRight');
    document.querySelector('#alerts').innerHTML = `
    <div class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        <span>${message}</span>
    </div>`;
    clearTimeout(window.successTimeout);
    window.successTimeout = setTimeout(() => {
        document.querySelector('#alerts').classList.add('animate__backOutRight');
        setTimeout(() => {
            document.querySelector('#alerts').innerHTML = '';
            document.querySelector('#alerts').classList.remove('animate__backOutRight');
            document.querySelector('#alerts').classList.remove('animate__backInRight');
            document.querySelector('#alert-wrapper').style.display = 'none';
            // document.querySelector('#alert-wrapper').close();
        }, 800);
    }, 15000);
};

window.sanitizeText = (text) => {
    if (!text) return "";
    const allowedPattern = /[^a-zA-Z0-9,.¡!¿?$%&()#+;/'"\n _-]/g;
    let sanitizedInput = DOMPurify.sanitize(text).replace(allowedPattern, "");
    sanitizedInput = sanitizedInput.trim().replace(/<[^>]*>?/gm, '');
    return sanitizedInput.replace(/\n/g, "<br>");
};


window.debounceDict = {};
window.addEventListenerDebounce = (name, element, event, callback) => {
    element.addEventListener(event, () => {
        clearTimeout(window.debounceDict[name]);
        window.debounceDict[name] = setTimeout(() => {
            callback();
        }, 300);
    });
}


if (window.showdown) {
    showdown.setOption('simpleLineBreaks', true);
    showdown.setOption('smoothLivePreview', true);
    showdown.setOption('simplifiedAutoLink', true);
    showdown.setOption('noHeaderId', true);
    showdown.setOption('tasklists', true);
    
    window.converter = new showdown.Converter();
    
    window.markdownToHTML = text => {
        const lineBreakToken = Date.now();
        text = text.split('\n').map(v => v.trim() == '' ? lineBreakToken : '\n' + v ).join('');
        const html = converter.makeHtml(text);
        const h = html.replaceAll('\n', '').replaceAll(lineBreakToken, '<br>');
        return h;
    }
}

const blobCache = {};
async function lazyLoadImages(elements) {
    for (const img of elements) {
        const imageUrl = img.dataset.lazySrc;
        if(blobCache[imageUrl]) {
            img.src = blobCache[imageUrl];
            continue;
        }
        try {
            img.removeAttribute('data-lazy-src');
            img.src = imageUrl + '/preview';
            const f = await fetch(imageUrl);
            const blob = await f.blob();
            const image = URL.createObjectURL(blob);
            blobCache[imageUrl] = image;
            img.src = image;
        } catch (error) {
            // we just ignore the error and let the browser handle it
            img.src = imageUrl;
        }
    }
}

const mutationCallback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
            if (node instanceof Element) {
                lazyLoadImages(node.querySelectorAll('img[data-lazy-src]'));
            }
        });
      }
    }
};
  
const observerOptions = {
    childList: true,
    subtree: true,
    attributes: true,
};

const observer = new MutationObserver(mutationCallback);

lazyLoadImages(document.querySelectorAll('img[data-lazy-src]'));

observer.observe(document.body, observerOptions);
window.transitionTo = (url) => {
    window.location.href = url;
    // try {
    //   if (document.startViewTransition) {
    //     document.startViewTransition(() => {
    //       window.location.href = url;
    //     });
    //   } else {
    //     window.location.href = url; // Fallback for unsupported browsers
    //   }
    // } catch (error) {
    //   console.error('View Transition Error:', error);
    //   window.location.href = url;
    // }
  };