"use server";

import { cookies } from "next/headers";

const SUPPORTED = ["en", "it"] as const;
type Locale = (typeof SUPPORTED)[number];

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
