import { Elysia } from 'elysia'
// import { staticPlugin } from '@elysiajs/static'

import { router } from './router'
import { loggerPlugin } from "./plugins/logger.plugin"
import { staticPlugin } from "./plugins/static.plugin"


const app = new Elysia()
    .use(loggerPlugin)
    .use(staticPlugin({ assets: 'src/static', prefix: '/static' }))
    .group('', app => app.use(router))
    .listen(Bun.env.PORT ?? 3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)