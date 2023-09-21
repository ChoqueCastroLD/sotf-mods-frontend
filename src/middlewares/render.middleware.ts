import { renderFile } from "pug";
import { join, dirname } from 'node:path';


export function render(template: string, data?: Object) {
    return async ({ store, user, token, set }: any) => {
        const template_path = join(dirname(import.meta.path), `../templates/${template}.pug`)
        set.headers['Content-Type'] = 'text/html; charset=utf-8'
        const API_URL = Bun.env.API_URL ?? ""
        return renderFile(template_path, {...data, ...store, user, token, API_URL})
    }
}