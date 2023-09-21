import { Elysia } from 'elysia'


const emojiStatus = new Map([
    [100, '💬'], // Continue
    [101, '🔄'], // Switching Protocols
    [200, '✅'], // OK
    [201, '✅🆕'], // Created
    [202, '✅🔄'], // Accepted
    [204, '✅🌐'], // No Content
    [300, '🔀'], // Multiple Choices
    [301, '🔃'], // Moved Permanently
    [302, '🔀'], // Found
    [304, '🔒'], // Not Modified
    [400, '❌'], // Bad Request
    [401, '🔒❌'], // Unauthorized
    [403, '🚫'], // Forbidden
    [404, '🔍❌'], // Not Found
    [405, '🚫🤷‍♀️'], // Method Not Allowed
    [500, '🔥'], // Internal Server Error
    [501, '🚧'], // Not Implemented
    [502, '🌐❌'], // Bad Gateway
    [503, '🔧'], // Service Unavailable
    [504, '⏱️'], // Gateway Timeout
    [505, '🌐🔒'], // HTTP Version Not Supported
]);

const parseCookie = (str: string) => str.split(';')
    .map((v: string) => v.split('='))
    .reduce((acc: any, v: string[]) => {
    acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
    return acc;
    }, {});

export const loggerPlugin = new Elysia()
    .onRequest(({ request }) => {
        const url = new URL(request.url)
        if (url.pathname.startsWith('/static')) return;
        const hasToken = parseCookie(request.headers.get('cookie') ?? "")?.token !== undefined;
        console.log(`📩 <-- ${request.method} ${url.pathname} ${hasToken ? '🔑 has token' : ''}`)
    })
    .onResponse(({ path, request, set }) => {
        if (path.startsWith('/static')) return;
        console.log(`${typeof set.status === 'number' ? emojiStatus.get(set.status) ?? "" : ""} --> ${request.method} ${path} ${set.status}`)
    })