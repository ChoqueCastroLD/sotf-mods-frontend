import { renderFile } from "pug";
import { join, dirname } from 'node:path';
import { getTranslator, getTranslations } from "../util/lang.util";


export function render(template: string, data?: Object) {
    return async ({ store, user, token, cookie: { lang }, set }: any) => {
        const template_path = join(dirname(import.meta.path), `../templates/${template}.pug`);
        set.headers['Content-Type'] = 'text/html; charset=utf-8';
        const API_URL = Bun.env.API_URL ?? "";
        return renderFile(template_path, {
            ...data,
            ...store,
            lang: lang.value || "en",
            translations: getTranslations(lang.value || "en"),
            _: getTranslator(lang.value || "en"),
            user,
            token,
            API_URL
        })
    }
}
