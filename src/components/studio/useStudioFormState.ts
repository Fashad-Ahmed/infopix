import { useState } from "react";
import type { StudioGenerateRequest } from "../../lib/api-client";

export type StudioFormValues = Omit<StudioGenerateRequest, "generateImages">;

export function useStudioFormState(onSubmit: (values: StudioFormValues) => void) {
  const [mode, setMode] = useState<"url" | "topic">("topic");
  const [rawText, setRawText] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");
  const [template, setTemplate] = useState<StudioFormValues["template"]>("editorial-landscape");
  const [primaryFont, setPrimaryFont] = useState<StudioFormValues["primaryFont"]>("modern-sans");
  const [accentStyle, setAccentStyle] = useState<StudioFormValues["accentStyle"]>("rule");
  const [illustrationStyle, setIllustrationStyle] = useState<StudioFormValues["illustrationStyle"]>("flat");
  const [showSourceFooter, setShowSourceFooter] = useState(true);
  const [density, setDensity] = useState<StudioFormValues["density"]>("standard");
  const [colorScheme, setColorScheme] = useState<StudioFormValues["colorScheme"]>("brand");
  const [userPrimary, setUserPrimary]       = useState("#0f172a");
  const [userAccent, setUserAccent]         = useState("#f59e0b");
  const [userBackground, setUserBackground] = useState("#f8f5ef");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base: StudioFormValues = {
      rawText,
      mode,
      stylePrompt: stylePrompt.trim() || undefined,
      template,
      primaryFont,
      accentStyle,
      illustrationStyle,
      showSourceFooter,
      density,
      narrativeFocus: "data-heavy",
      colorScheme: colorScheme ?? "editorial",
    };
    if (colorScheme === "custom") {
      base.userPrimary    = userPrimary;
      base.userAccent     = userAccent;
      base.userBackground = userBackground;
    }
    onSubmit(base);
  };

  return {
    mode, setMode,
    rawText, setRawText,
    stylePrompt, setStylePrompt,
    template, setTemplate,
    primaryFont, setPrimaryFont,
    accentStyle, setAccentStyle,
    illustrationStyle, setIllustrationStyle,
    showSourceFooter, setShowSourceFooter,
    density, setDensity,
    colorScheme, setColorScheme,
    userPrimary, setUserPrimary,
    userAccent, setUserAccent,
    userBackground, setUserBackground,
    handleSubmit,
  };
}
