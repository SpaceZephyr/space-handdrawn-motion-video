import { existsSync, globSync } from "node:fs";
export function findChrome() {
  const home = process.env.HOME;
  const list = [process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ...globSync(home + "/.cache/puppeteer/chrome-headless-shell/*/*/chrome-headless-shell"),
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
  const hit = list.find(p => existsSync(p));
  if (!hit) { console.error("找不到 Chrome，装一个或设 CHROME_PATH"); process.exit(1); }
  return hit;
}
