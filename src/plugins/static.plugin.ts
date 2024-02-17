import { Elysia } from 'elysia'

import path from 'node:path'


export const staticPlugin = (options: any) => new Elysia()
    .get('/static/*', ({ request }) => {
        const url = new URL(request.url);
        const projectPath = path.dirname(Bun.main);
        const filePath = path.join(projectPath, '../', options.assets, url.pathname.replace(options.prefix, ''));
        return Bun.file(filePath);
    })
