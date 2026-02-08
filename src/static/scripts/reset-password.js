const form = document.querySelector('#reset-password-form');
const submitBtn = document.querySelector('#submit-btn');

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    showError(_("Invalid reset link. Please request a new password reset."));
    submitBtn.disabled = true;
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!token) {
        showError(_("Invalid reset link. Please request a new password reset."));
        return;
    }

    const formData = new FormData(form);
    const body = Object.fromEntries(formData);
    body.token = token;

    submitBtn.disabled = true;
    submitBtn.textContent = _("Resetting...");

    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/auth/reset-password`, {
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

        showSuccess(_("Password reset successfully! Redirecting to login..."));
        setTimeout(() => {
            window.location.href = '/login?reset=true';
        }, 2000);
    } catch (error) {
        console.error(error);
        showError(error);
        submitBtn.disabled = false;
        submitBtn.textContent = _("reset_password.reset_password");
    }
});
