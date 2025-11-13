// Handle logout - clear localStorage and call logout API
(async function() {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            // Call logout API to invalidate token on server
            await fetch(`${PUBLIC_API_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout API call failed:', error);
        }
        
        // Clear token from localStorage
        localStorage.removeItem('token');
    }
    
    // Redirect to login (will happen via server redirect)
})();

