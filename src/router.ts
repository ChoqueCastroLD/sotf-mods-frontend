import { Elysia } from 'elysia'

import { render } from './middlewares/render.middleware'
import { authMiddleware } from './middlewares/auth.middleware'

let last_stats_update = 0;
let stats = {
    "users": 2,
    "mods": 2,
    "downloads": 2,
    "developers": 2,
}

let last_categories_update = 0;
let categories = [
    { id: 1, name: "Script", slug: "script" },
]

const loggedOnly = async ({ user, set }: any) => {
    if (!user) {
        set.redirect = '/login'
    }
}

async function getModIdFromSlugs(user_slug: string, mod_slug: string) {
    const mod = await fetch(`${Bun.env.API_URL}/api/mods/find?user_slug=${user_slug}&mod_slug=${mod_slug}`).then(res => res.json());
    return mod.mod_id
}

export const router = new Elysia()
    .use(authMiddleware)
    // auth
    .get('/login', render('login'))
    .get('/register', render('register'))
    .get('/logout', ({ cookie: { token }, set }) => {
        token.remove();
        set.redirect = '/login'
    })
    // user
    .get('/profile/:user_slug', async (context) => {
        const { params: { user_slug } } = context;
        const userProfile = await fetch(`${Bun.env.API_URL}/api/users/${user_slug}`).then(res => res.json());
        return render('profile', { userProfile })(context);
    })
    .get('/upload', async (context) => {
        if (Date.now() - last_categories_update > 1000 * 60 * 5) {
            categories = await fetch(`${Bun.env.API_URL}/api/categories`).then(res => res.json());
            last_categories_update = Date.now();
        }
        return render('upload', { categories })(context);
    }, { beforeHandle: loggedOnly })
    // public
    .get('/', ({ set }) => {
        set.redirect = '/mods'
    })
    .get('/mods', async (context) => {
        if (Date.now() - last_stats_update > 1000 * 60 * 5) {
            stats = await fetch(`${Bun.env.API_URL}/api/stats`).then(res => res.json());
            last_stats_update = Date.now();
        }
        if (Date.now() - last_categories_update > 1000 * 60 * 5) {
            categories = await fetch(`${Bun.env.API_URL}/api/categories`).then(res => res.json());
            last_categories_update = Date.now();
        }
        return render('mods', { categories, stats })(context);
    })
    .get('/mods/:user_slug/:mod_slug', async (context) => {
        const { params: { user_slug, mod_slug } } = context;
        const mod_id = await getModIdFromSlugs(user_slug, mod_slug)
        const mod = await fetch(`${Bun.env.API_URL}/api/mods/${mod_id}`).then(res => res.json())
        return render('mod', { mod })(context)
    })
    .get('/mods/:user_slug/:mod_slug/download/:version', async ({ params: { user_slug, mod_slug, version }, request, set }) => {
        const ip = "" + request.headers.get("x-forwarded-for")
        const agent = "" + request.headers.get("user-agent")
        const mod_id = await getModIdFromSlugs(user_slug, mod_slug)
        const f = await fetch(`${Bun.env.API_URL}/api/mods/${mod_id}/download/${version}?ip=${ip}&agent=${agent}`)
        const blob = await f.blob()
        set.headers['Content-Type'] = "" + f.headers.get('Content-Type')
        set.headers['Content-Length'] = "" + f.headers.get('Content-Length')
        set.headers['Content-Disposition'] = "" + f.headers.get('Content-Disposition')
        return blob
    })
    .get('/loader', render('loader'))