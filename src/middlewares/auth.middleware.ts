import { Elysia } from 'elysia'
// Ensure TypeBox is available for Elysia
import '@sinclair/typebox'

export const authMiddleware = new Elysia()
    .derive({as: 'global'}, async ({ cookie }) => {
        try {
            // Read token from frontend cookie (same domain)
            const token = cookie?.token?.value;
            
            if (!token) {
                return { user: null, token: null };
            }

            // Call API to get user info using the token
            const apiUrl = Bun.env.PUBLIC_API_URL;
            if (!apiUrl) {
                return { user: null, token: null };
            }

            try {
                const response = await fetch(`${apiUrl}/api/auth/check`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.status && result.data) {
                        return { user: result.data, token };
                    }
                }
            } catch (error) {
                console.error(`[Frontend Auth] Failed to fetch user info:`, error);
            }

            return { user: null, token: null };
        } catch (outerError) {
            console.error(`[Frontend Auth] Outer exception in derive:`, outerError);
            return { user: null, token: null };
        }
    })
