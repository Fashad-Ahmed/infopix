import type { useTranslations } from "next-intl";

type T = ReturnType<typeof useTranslations<"studio.form">>;

// Translated pill-group option lists for the studio form. Pulled out of
// StudioForm so the component only deals with state + rendering.
export function useStudioFormOptions(t: T) {
  const TEMPLATES = [
    { value: "editorial-portrait"  as const, label: t("templates.editorial-portrait"),  hint: t("templateHints.editorial-portrait") },
    { value: "editorial-landscape" as const, label: t("templates.editorial-landscape"), hint: t("templateHints.editorial-landscape") },
    { value: "social-square"       as const, label: t("templates.social-square"),        hint: t("templateHints.social-square") },
    { value: "social-wide"         as const, label: t("templates.social-wide"),          hint: t("templateHints.social-wide") },
    { value: "poster"              as const, label: t("templates.poster"),               hint: t("templateHints.poster") },
    { value: "sidebar-portrait"     as const, label: t("templates.sidebar-portrait"),     hint: t("templateHints.sidebar-portrait") },
    { value: "asymmetric-landscape" as const, label: t("templates.asymmetric-landscape"), hint: t("templateHints.asymmetric-landscape") },
    { value: "banner-bottom-square" as const, label: t("templates.banner-bottom-square"), hint: t("templateHints.banner-bottom-square") },
    { value: "magazine-grid"        as const, label: t("templates.magazine-grid"),        hint: t("templateHints.magazine-grid") },
  ];
  const FONTS = [
    { value: "condensed-sans" as const, label: t("fonts.condensed-sans") },
    { value: "modern-sans"    as const, label: t("fonts.modern-sans") },
    { value: "slab"           as const, label: t("fonts.slab") },
    { value: "display-serif"  as const, label: t("fonts.display-serif") },
    { value: "corporate"      as const, label: t("fonts.corporate") },
    { value: "playful"        as const, label: t("fonts.playful") },
    { value: "monospaced"     as const, label: t("fonts.monospaced") },
  ];
  const ACCENT_STYLES = [
    { value: "rule"   as const, label: t("accents.rule") },
    { value: "ribbon" as const, label: t("accents.ribbon") },
    { value: "stamp"  as const, label: t("accents.stamp") },
    { value: "none"   as const, label: t("accents.none") },
  ];
  const ILLUSTRATION_STYLES = [
    { value: "flat"      as const, label: t("illustrations.flat") },
    { value: "editorial" as const, label: t("illustrations.editorial") },
    { value: "minimal"   as const, label: t("illustrations.minimal") },
    { value: "none"      as const, label: t("illustrations.none") },
  ];
  const DEPTHS = [
    { value: "executive-summary" as const, label: t("depths.executive-summary") },
    { value: "standard"          as const, label: t("depths.standard") },
    { value: "deep-dive"         as const, label: t("depths.deep-dive") },
  ];

  return { TEMPLATES, FONTS, ACCENT_STYLES, ILLUSTRATION_STYLES, DEPTHS };
}
