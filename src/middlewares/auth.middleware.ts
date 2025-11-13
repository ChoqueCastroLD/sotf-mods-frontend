import { Elysia } from 'elysia'
// Ensure TypeBox is available for Elysia
import '@sinclair/typebox'

export const authMiddleware = new Elysia()
    .derive({as: 'global'}, async (context) => {
        try {
            // Token is now stored in localStorage on the client
            // For server-side rendering, we can't access localStorage
            // The token will be read from localStorage in the client-side scripts
            // User info will be fetched client-side after page load
            return { user: null, token: null };
        } catch (outerError) {
            console.error(`[Frontend Auth] Outer exception in derive:`, outerError);
            return { user: null, token: null };
        }
    })
