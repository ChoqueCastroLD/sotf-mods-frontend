import { join, dirname } from "node:path";
import { getTranslator, getTranslations, languages } from "../util/lang.util";

const nunjucks = require("nunjucks");

const templatesFolder = join(dirname(import.meta.path), `../templates`);

nunjucks.configure(templatesFolder, { autoescape: true, watch: true });

export function render(template: string, data?: Object) {
  return async ({ store, user, token, cookie, request, set }: any) => {
    let lang = cookie?.lang?.value;
    if (!lang) {
      lang = request.headers
        .get("accept-language")
        ?.split(",")[0]
        .split("-")[0]
        ?.toLowerCase()
        .trim()
        .substring(0, 2);
    }
    if (!lang) {
      lang = "en";
    }
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    const PUBLIC_API_URL = Bun.env.PUBLIC_API_URL ?? "";
    return nunjucks.render(template + ".njk", {
      ...data,
      ...store,
      lang,
      languages,
      translations: getTranslations(lang),
      _: getTranslator(lang),
      user,
      token,
      PUBLIC_API_URL,
      layout: {
        encoded_api_url: btoa(JSON.stringify(PUBLIC_API_URL)),
        encoded_translations: JSON.stringify(getTranslations(lang)),
        encoded_user: btoa(JSON.stringify(user)),
        encoded_token: btoa(JSON.stringify(token)),
      },
    });
  };
}
