import { defineRouting } from "next-intl/routing";

/**
 * i18n scaffolding: English + Spanish shipping first; layout primitives are
 * RTL-ready (logical CSS properties throughout) so adding an RTL locale is a
 * config change, not a rewrite.
 */
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
});
