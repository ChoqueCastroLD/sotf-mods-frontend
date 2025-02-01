import ch from "../translations/ch.translations";
import de from "../translations/de.translations";
import en from "../translations/en.translations";
import es from "../translations/es.translations";
import fr from "../translations/fr.translations";
import nl from "../translations/nl.translations";
import pt from "../translations/pt.translations";
import ru from "../translations/ru.translations";
import pl from "../translations/pl.translations";
import se from "../translations/se.translations";
import it from "../translations/it.translations";
import tr from "../translations/tr.translations";

function getIndividualTranslations(lang: string): any {
  switch (lang) {
    case "ch":
      return ch;
    case "de":
      return de;
    case "en":
      return en;
    case "es":
      return es;
    case "fr":
      return fr;
    case "nl":
      return nl;
    case "pt":
      return pt;
    case "ru":
      return ru;
    case "pl":
      return pl;
    case "se":
      return se;
    case "it":
      return it;
    case "tr":
      return tr;
    default:
      return en;
  }
}

export function getTranslations(lang: string): any {
  return {
    ...getIndividualTranslations("en"),
    ...getIndividualTranslations(lang),
  };
}

export function _(lang: string, key: string): string {
  return getTranslations(lang)[key];
}

export function getTranslator(lang: string) {
  return (key: string) => _(lang, key);
}

export const languages = [
  { code: "ch", name: "中文" },
  { code: "de", name: "Deutsch" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "nl", name: "Nederlands" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "pl", name: "Polski" },
  { code: "se", name: "Svenska" },
  { code: "it", name: "Italiano" },
  { code: "tr", name: "Türkçe" },
];
