import { Elysia } from 'elysia'


export const authMiddleware = new Elysia()
    .derive(async ({ cookie: { token } }) => {
        if (!token) return {};
        const user = await fetch(`${Bun.env.API_URL}/api/auth/check`, {
            headers: {
                authorization: "Bearer " + token?.value
            }
        }).then(res => res.json())
        if (user && user.slug) {
            return { token: token?.value, user };
        }
        return {};
    })