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
            body: JSON.stringify(body)
        });

        const { status, data, message } = await response.json();

        if (!status || !data?.token) {
            throw message || _("Something went wrong");
        }

        loginForm.reset();
        document.cookie = `token=${data.token}; Path=/`;
        location.href = '/';
    } catch (error) {
        console.error(error);
        showError(error);
    }
});
