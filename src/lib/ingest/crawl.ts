import * as cheerio from "cheerio";
import type { Block, Page, Source } from "../types";

const MAX_PAGES = 20;
const MAX_DEPTH = 2;
const TIMEOUT_MS = 15000;
const UA = "CritiqBot/0.1 (+portfolio review; fetches only pages the owner submitted)";

export class CrawlError extends Error {
  constructor(public reasons: string[], message: string) {
    super(message);
  }
}

interface FetchResult {
  ok: boolean;
  status: number;
  html?: string;
  finalUrl: string;
  reason?: string;
}

async function fetchPage(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok) {
      const reason =
        res.status === 401 || res.status === 403
          ? "The site requires sign-in or blocks automated access"
          : res.status === 404
            ? "The page was not found (404)"
            : `The server responded with an error (${res.status})`;
      return { ok: false, status: res.status, finalUrl: res.url || url, reason };
    }
    if (!type.includes("html")) {
      return { ok: false, status: res.status, finalUrl: res.url || url, reason: `Not a web page (${type || "unknown type"})` };
    }
    return { ok: true, status: res.status, html: await res.text(), finalUrl: res.url || url };
  } catch (err) {
    const name = (err as Error).name;
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      reason: name === "TimeoutError" ? "The site took too long to respond" : "The site could not be reached",
    };
  }
}

async function robotsDisallows(origin: string): Promise<string[]> {
  try {
    const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000), headers: { "user-agent": UA } });
    if (!res.ok) return [];
    const lines = (await res.text()).split(/\r?\n/);
    const rules: string[] = [];
    let applies = false;
    for (const line of lines) {
      const [k, ...rest] = line.split(":");
      const key = k.trim().toLowerCase();
      const val = rest.join(":").trim();
      if (key === "user-agent") applies = val === "*" || val.toLowerCase().includes("critiq");
      else if (applies && key === "disallow" && val) rules.push(val);
    }
    return rules;
  } catch {
    return [];
  }
}

const SKIP_EXT = /\.(png|jpe?g|gif|svg|webp|pdf|zip|mp4|mov|css|js|xml|ico)$/i;
const CASE_HINT = /(work|project|case|portfolio|stud|design)/i;

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  const url = new URL(u);
  url.hash = "";
  return url.toString();
}

function words(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

function parsePage(html: string, url: string, pageId: string, sourceId: string) {
  const $ = cheerio.load(html);
  const title = ($("title").first().text() || $("h1").first().text() || url).trim().slice(0, 140);
  const hasPassword = $('input[type="password"]').length > 0;

  $("script, style, noscript, svg, iframe, template").remove();
  const root = $("main").length ? $("main").first() : $("article").length ? $("article").first() : $("body");
  root.find("nav, footer, header[role=banner]").remove();

  const blocks: Block[] = [];
  let n = 0;
  const seenImg = new Set<string>();
  root.find("h1, h2, h3, h4, p, li, blockquote, figcaption, img").each((_, el) => {
    const $el = $(el);
    const tag = el.tagName.toLowerCase();
    if (tag === "img") {
      const src = $el.attr("src") || $el.attr("data-src") || ($el.attr("srcset") || "").split(" ")[0];
      if (!src || src.startsWith("data:")) return;
      const width = parseInt($el.attr("width") || "0", 10);
      if (width && width < 80) return;
      let abs: string;
      try {
        abs = new URL(src, url).toString();
      } catch {
        return;
      }
      if (seenImg.has(abs)) return;
      seenImg.add(abs);
      blocks.push({ id: `${pageId}.b${++n}`, pageId, kind: "image", text: ($el.attr("alt") || "").trim(), src: abs });
      return;
    }
    // Avoid double-counting text nested in li > p etc.
    if (tag === "p" && $el.parents("li, blockquote").length) return;
    const text = $el.text().replace(/\s+/g, " ").trim();
    if (!text || text.length < 2) return;
    const kind = tag.startsWith("h") ? "heading" : tag === "li" ? "list" : "text";
    blocks.push({ id: `${pageId}.b${++n}`, pageId, kind, text });
  });

  const links: string[] = [];
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;
    try {
      const abs = new URL(href, url);
      abs.hash = "";
      links.push(abs.toString());
    } catch {}
  });

  const textBlocks = blocks.filter((b) => b.kind !== "image");
  const page: Page = {
    id: pageId,
    sourceId,
    title,
    url,
    status: "reviewed",
    blocks,
    wordCount: textBlocks.reduce((s, b) => s + words(b.text), 0),
    imageCount: blocks.length - textBlocks.length,
  };
  if (hasPassword && page.wordCount < 80) {
    page.status = "skipped";
    page.reason = "Password-protected page";
    page.blocks = [];
  } else if (page.wordCount < 20 && page.imageCount === 0) {
    page.status = "failed";
    page.reason = "Little readable content — the page may need JavaScript to render";
  }
  return { page, links };
}

export async function crawlPortfolio(rawUrl: string, sourceId: string, startIndex: number) {
  let start: string;
  try {
    start = normalizeUrl(rawUrl);
  } catch {
    throw new CrawlError(["The URL isn't valid"], "We couldn't read that URL.");
  }
  const origin = new URL(start).origin;
  const disallow = await robotsDisallows(origin);
  const allowed = (u: string) => !disallow.some((rule) => new URL(u).pathname.startsWith(rule));

  const first = await fetchPage(start);
  if (!first.ok || !first.html) {
    throw new CrawlError(
      [first.reason ?? "The site could not be reached", "The page may be password-protected", "Automated access may be blocked"],
      "We couldn't access your portfolio.",
    );
  }

  const pages: Page[] = [];
  const visited = new Set<string>([start, first.finalUrl]);
  const queue: { url: string; depth: number; html?: string }[] = [{ url: first.finalUrl, depth: 0, html: first.html }];
  let idx = startIndex;

  while (queue.length && pages.length < MAX_PAGES) {
    const item = queue.shift()!;
    let html = item.html;
    const pageId = `p${++idx}`;
    if (!html) {
      const r = await fetchPage(item.url);
      if (!r.ok || !r.html) {
        pages.push({
          id: pageId, sourceId, title: new URL(item.url).pathname, url: item.url, status: "failed",
          reason: r.reason, blocks: [], wordCount: 0, imageCount: 0,
        });
        continue;
      }
      html = r.html;
    }
    const { page, links } = parsePage(html, item.url, pageId, sourceId);
    pages.push(page);

    if (item.depth < MAX_DEPTH) {
      const next = links
        .filter((l) => l.startsWith(origin) && !SKIP_EXT.test(new URL(l).pathname) && !visited.has(l) && allowed(l))
        .sort((a, b) => Number(CASE_HINT.test(b)) - Number(CASE_HINT.test(a)));
      for (const l of next) {
        if (visited.has(l)) continue;
        visited.add(l);
        queue.push({ url: l, depth: item.depth + 1 });
      }
    }
  }

  const failed = pages.filter((p) => p.status !== "reviewed").length;
  const source: Source = {
    id: sourceId,
    kind: "url",
    label: new URL(start).host + new URL(start).pathname.replace(/\/$/, ""),
    status: failed === 0 ? "ok" : failed === pages.length ? "failed" : "partial",
    error: failed ? `${failed} of ${pages.length} pages could not be fully read` : undefined,
  };
  if (queue.length) source.error = [source.error, `Stopped after ${MAX_PAGES} pages`].filter(Boolean).join(" · ");
  return { source, pages };
}
