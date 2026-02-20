import { access, readFile } from "node:fs/promises";

type OgFontStyle = "normal" | "bold";
type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: number;
  style: OgFontStyle;
};

type LocalFontConfig = {
  name: string;
  weight: number;
  style: OgFontStyle;
  paths: string[];
};

async function loadGoogleFont(
  font: string,
  text: string,
  weight: number
): Promise<ArrayBuffer> {
  const API = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;

  const css = await (
    await fetch(API, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    })
  ).text();

  const resource = css.match(
    /src: url\((.+?)\) format\('(opentype|truetype)'\)/
  );

  if (!resource) throw new Error("Failed to download dynamic font");

  const res = await fetch(resource[1]);

  if (!res.ok) {
    throw new Error("Failed to download dynamic font. Status: " + res.status);
  }

  return res.arrayBuffer();
}

async function resolveReadablePath(paths: string[]): Promise<string | null> {
  for (const path of paths) {
    try {
      await access(path);
      return path;
    } catch {
      // Try next path.
    }
  }

  return null;
}

async function loadLocalFallbackFonts(): Promise<OgFont[]> {
  const configuredRegularPath = process.env.OG_FONT_REGULAR_PATH;
  const configuredBoldPath = process.env.OG_FONT_BOLD_PATH;

  const fallbackFonts: LocalFontConfig[] = [
    {
      name: "DejaVu Sans",
      weight: 400,
      style: "normal",
      paths: [
        ...(configuredRegularPath ? [configuredRegularPath] : []),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/local/share/fonts/DejaVuSans.ttf",
      ],
    },
    {
      name: "DejaVu Sans",
      weight: 700,
      style: "bold",
      paths: [
        ...(configuredBoldPath ? [configuredBoldPath] : []),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/local/share/fonts/DejaVuSans-Bold.ttf",
      ],
    },
  ];

  const fonts = (
    await Promise.all(
      fallbackFonts.map(async ({ name, paths, weight, style }) => {
        const resolvedPath = await resolveReadablePath(paths);

        if (!resolvedPath) {
          return null;
        }

        const data = await readFile(resolvedPath);
        const copiedData = Uint8Array.from(data);

        return {
          name,
          data: copiedData.buffer,
          weight,
          style,
        } satisfies OgFont;
      })
    )
  ).filter((font): font is OgFont => font !== null);

  if (fonts.length > 0) {
    return fonts;
  }

  throw new Error(
    "No fallback fonts available for OG image generation. Set OG_FONT_REGULAR_PATH and OG_FONT_BOLD_PATH to local .ttf files."
  );
}

async function loadGoogleFonts(text: string): Promise<OgFont[]> {
  const fontsConfig = [
    {
      name: "IBM Plex Mono",
      font: "IBM+Plex+Mono",
      weight: 400,
      style: "normal" as const,
    },
    {
      name: "IBM Plex Mono",
      font: "IBM+Plex+Mono",
      weight: 700,
      style: "bold" as const,
    },
  ];

  const fonts = (
    await Promise.all(
      fontsConfig.map(async ({ name, font, weight, style }) => {
        try {
          const data = await loadGoogleFont(font, text, weight);
          return { name, data, weight, style } satisfies OgFont;
        } catch {
          return null;
        }
      })
    )
  ).filter((font): font is OgFont => font !== null);

  if (fonts.length > 0) {
    return fonts;
  }

  console.warn(
    "[og-image] Google Fonts are unreachable. Using local fallback fonts for OG image generation."
  );

  return loadLocalFallbackFonts();
}

export default loadGoogleFonts;
