const registerForm = document.querySelector('#register-form');
const confirmPasswordError = document.querySelector('#confirm_password-error');

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData);
    
    try {
        if (data.password !== data.confirm_password) {
            throw _("Passwords do not match");
        }
        const response = await fetch(`${PUBLIC_API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const { status, message } = await response.json();

        if (!status) {
            throw message || _("Something went wrong");
        }

        registerForm.reset();
        location.href = '/login?registered=true';
    } catch (error) {
        console.error(error);
        showError(error);
    }
});