const loginForm = document.querySelector('#login-form');

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('registered')) {
    showSuccess(_("Success! You have successfully registered. Please login."));
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const body = Object.fromEntries(formData);

    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Important: include cookies in request/response
            body: JSON.stringify(body)
        });

        const { status, data, message } = await response.json();

        if (!status || !data?.token) {
            throw message || _("Something went wrong");
        }

        // Set token in cookie (frontend's own domain, works fine)
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2); // 2 days
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `token=${data.token}; path=/; expires=${expiresAt.toUTCString()}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        
        // Also store in localStorage as backup
        localStorage.setItem('token', data.token);
        
        loginForm.reset();
        window.location.href = '/mods';
    } catch (error) {
        console.error(error);
        showError(error);
    }
});
