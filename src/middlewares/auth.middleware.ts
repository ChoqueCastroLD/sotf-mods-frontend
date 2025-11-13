import { Elysia } from 'elysia'
// Ensure TypeBox is available for Elysia
import '@sinclair/typebox'

export const authMiddleware = new Elysia()
    .derive({as: 'global'}, async (context) => {
        try {
            const { cookie, request } = context;
            const token = cookie?.token;
            
            if (!token?.value) {
                return {};
            }
            
            const tokenValue = token.value as string;
            
            try {
                const apiUrl = Bun.env.PUBLIC_API_URL;
                const checkUrl = `${apiUrl}/api/auth/check`;
                
                const response = await fetch(checkUrl, {
                    headers: {
                        authorization: "Bearer " + tokenValue,
                        cookie: `token=${tokenValue}`
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    console.error(`[Frontend Auth] Auth check failed: ${response.status} ${response.statusText}`);
                    return {};
                }
                
                const result = await response.json();
                const { status, data: user } = result;
                
                if (status && user) {
                    return { token: tokenValue, user };
                } else {
                    console.error(`[Frontend Auth] Auth check returned no user`);
                }
            } catch (error) {
                console.error(`[Frontend Auth] Auth check exception:`, error);
            }
            return {};
        } catch (outerError) {
            console.error(`[Frontend Auth] Outer exception in derive:`, outerError);
            return {};
        }
    })
