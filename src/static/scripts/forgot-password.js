const form = document.querySelector('#forgot-password-form');
const submitBtn = document.querySelector('#submit-btn');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const body = Object.fromEntries(formData);

    submitBtn.disabled = true;
    submitBtn.textContent = _("Sending...");

    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const { status, message } = await response.json();

        if (!status) {
            throw message || _("Something went wrong");
        }

        showSuccess(_("If an account with that email exists, a reset link has been sent. Check your inbox."));
        form.reset();
    } catch (error) {
        console.error(error);
        showError(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = _("forgot_password.send_reset_link");
    }
});
