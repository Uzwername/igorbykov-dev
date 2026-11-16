// "https://github.com/Uzwername" -> "/Uzwername"
export const urlPath = (url: string) => new URL(url).pathname;

// "https://github.com/Uzwername" -> "Uzwername"
export const lastSegment = (url: string) =>
  urlPath(url).split('/').filter(Boolean).at(-1);
