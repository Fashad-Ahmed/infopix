export function slugify(input: string): string {
  return (
    (input || "infographic")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "infographic"
  );
}
