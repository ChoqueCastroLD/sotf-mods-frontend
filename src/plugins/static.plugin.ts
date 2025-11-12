import { Elysia } from 'elysia'

import path from 'node:path'

export const staticPlugin = (options: any) => new Elysia()
    .get('/static/*', ({ request }) => {
        const url = new URL(request.url);
        // Use process.cwd() to get the project root directory
        const projectRoot = process.cwd();
        const filePath = path.join(projectRoot, options.assets, url.pathname.replace(options.prefix, ''));
        return Bun.file(filePath);
    })
