import { Elysia } from 'elysia'
// Ensure TypeBox is available for Elysia
import '@sinclair/typebox'

// Helper to parse cookies from header string
function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;
    
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=');
        if (name && valueParts.length > 0) {
            cookies[name] = decodeURIComponent(valueParts.join('='));
        }
    });
    return cookies;
}

export const authMiddleware = new Elysia()
    .derive({as: 'global'}, async ({ cookie, request }) => {
        const requestPath = request.url;
        console.log(`[Frontend Auth] Processing request: ${requestPath}`);
        
        try {
            // Try to read token from Elysia cookie plugin first
            let token: string | null | undefined = cookie?.token?.value as string | undefined;
            const tokenStr = typeof token === 'string' ? token : null;
            console.log(`[Frontend Auth] Token from Elysia cookie plugin: ${tokenStr ? 'found' : 'not found'}`, tokenStr ? `${tokenStr.substring(0, 20)}...` : '');
            
            // Decode if token was encoded (Elysia cookie plugin may not decode automatically)
            if (tokenStr) {
                try {
                    // Try to decode - if it fails, token wasn't encoded
                    const decoded = decodeURIComponent(tokenStr);
                    // Only use decoded if it's different (meaning it was encoded)
                    if (decoded !== tokenStr || tokenStr.includes('%')) {
                        console.log(`[Frontend Auth] Decoded token (was encoded)`);
                        token = decoded;
                    } else {
                        console.log(`[Frontend Auth] Token was not encoded, using as-is`);
                        token = tokenStr;
                    }
                } catch (e) {
                    console.log(`[Frontend Auth] Decode attempt failed, using token as-is:`, e);
                    // Token wasn't encoded or decode failed, use as-is
                    token = tokenStr;
                }
            } else {
                token = null;
            }
            
            // Fallback: parse cookie header directly if Elysia cookie plugin didn't work
            if (!token) {
                console.log(`[Frontend Auth] Trying to read token from cookie header directly`);
                const cookieHeader = request.headers.get('cookie');
                console.log(`[Frontend Auth] Cookie header present: ${!!cookieHeader}`, cookieHeader ? `${cookieHeader.substring(0, 100)}...` : '');
                
                if (cookieHeader) {
                    const cookies = parseCookieHeader(cookieHeader);
                    console.log(`[Frontend Auth] Parsed cookies:`, Object.keys(cookies));
                    token = cookies.token || null;
                    const tokenFromHeader = typeof token === 'string' ? token : null;
                    console.log(`[Frontend Auth] Token from parsed cookies: ${tokenFromHeader ? 'found' : 'not found'}`, tokenFromHeader ? `${tokenFromHeader.substring(0, 20)}...` : '');
                } else {
                    console.log(`[Frontend Auth] No cookie header found in request`);
                }
            }
            
            if (!token || typeof token !== 'string') {
                console.log(`[Frontend Auth] No token found, returning null user`);
                return { user: null, token: null };
            }

            console.log(`[Frontend Auth] Token found, length: ${token.length}, calling API to verify`);

            // Call API to get user info using the token
            const apiUrl = Bun.env.PUBLIC_API_URL;
            if (!apiUrl) {
                console.error('[Frontend Auth] PUBLIC_API_URL is not set');
                return { user: null, token: null };
            }

            console.log(`[Frontend Auth] Calling API: ${apiUrl}/api/auth/check`);

            try {
                const response = await fetch(`${apiUrl}/api/auth/check`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log(`[Frontend Auth] API response status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    const result = await response.json();
                    console.log(`[Frontend Auth] API response data:`, { 
                        status: result.status, 
                        hasData: !!result.data,
                        userSlug: result.data?.slug 
                    });
                    
                    if (result.status && result.data) {
                        console.log(`[Frontend Auth] User authenticated successfully: ${result.data.name} (${result.data.slug})`);
                        return { user: result.data, token };
                    } else {
                        console.warn('[Frontend Auth] API returned success but no user data:', result);
                    }
                } else {
                    const errorText = await response.text().catch(() => '');
                    console.warn(`[Frontend Auth] API check failed: ${response.status} ${response.statusText}`, errorText);
                }
            } catch (error) {
                console.error(`[Frontend Auth] Failed to fetch user info:`, error);
                if (error instanceof Error) {
                    console.error(`[Frontend Auth] Error details:`, error.message, error.stack);
                }
            }

            console.log(`[Frontend Auth] Returning null user after API call failure`);
            return { user: null, token: null };
        } catch (outerError) {
            console.error(`[Frontend Auth] Outer exception in derive:`, outerError);
            if (outerError instanceof Error) {
                console.error(`[Frontend Auth] Outer error details:`, outerError.message, outerError.stack);
            }
            return { user: null, token: null };
        }
    })
