export function syncDocumentLanguage(lang) {
  try {
    const isArabic = lang === "ar";
    document.documentElement.lang = isArabic ? "ar" : "en";
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  } catch {
    // ignore
  }
}

