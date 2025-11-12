import { Elysia } from 'elysia'
// Ensure TypeBox is available for Elysia
import '@sinclair/typebox'

export const authMiddleware = new Elysia()
    .derive(async ({ cookie: { token } }) => {
        if (!token?.value) return {};
        const { status, data: user } = await fetch(`${Bun.env.PUBLIC_API_URL}/api/auth/check`, {
            headers: {
                authorization: "Bearer " + token?.value
            }
        }).then(res => res.json())
        if (status && user) {
            return { token: token?.value, user };
        }
        return {};
    })