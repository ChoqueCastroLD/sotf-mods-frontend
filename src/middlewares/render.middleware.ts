import { renderFile } from "pug";
import { join, dirname } from 'node:path';
import { getTranslator, getTranslations } from "../util/lang.util";


export function render(template: string, data?: Object) {
    return async ({ store, user, token, cookie, request, set }: any) => {
        let lang = cookie?.lang?.value;
        if (!lang) {
            lang = request.headers.get('accept-language')?.split(",")[0].split("-")[0]?.toLowerCase().trim().substring(0, 2);
        }
        if (!lang) {
            lang = "en";
        }
        const template_path = join(dirname(import.meta.path), `../templates/${template}.pug`);
        set.headers['Content-Type'] = 'text/html; charset=utf-8';
        const API_URL = Bun.env.API_URL ?? "";
        return renderFile(template_path, {
            ...data,
            ...store,
            lang,
            translations: getTranslations(lang),
            _: getTranslator(lang),
            user,
            token,
            API_URL
        })
    }
}
