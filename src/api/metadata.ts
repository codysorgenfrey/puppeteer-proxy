import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';
import NodeCron from 'node-cron';
import throwServerError, { ServerError } from './utils.js';
import { Request, Response } from 'express';

const cache = new NodeCache();

NodeCron.schedule('0 0 * * *', () => {
  const { vsize, ksize } = cache.getStats();
  const cacheSize = (vsize + ksize) * 0.000001;
  if (cacheSize > 128) cache.flushAll();
});

export default async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (url === undefined) throwServerError('Missing URL', 400);

    // validate URL
    const jsUrl = new URL(url); // will throw if invalid
    if (jsUrl.protocol !== 'http:' && jsUrl.protocol !== 'https:')
      throwServerError('Invalid URL', 400);
    const valid = await fetch(url, { method: 'HEAD' }).then((r) => r.ok);
    if (!valid) throwServerError(`${url} not found`, 404);

    // Check cache
    if (cache.has(url)) return res.json(cache.get(url));

    // Fetch metadata if not cached
    const metadata = await fetch(url)
      .then((r) => r.text())
      .then((text) => {
        const $ = cheerio.load(text);

        // Title
        const titleElement = $('title');
        const title =
          titleElement.length > 0 ? titleElement.text() : 'Untitled';

        // Charset
        const charsetElement = $('meta[charset]');
        const charset =
          charsetElement.length > 0 ? charsetElement.attr('charset') : 'utf-8';

        // Description
        const descriptionElement = $(
          'meta[name="description"], meta[property="og:description"]',
        );
        const description =
          descriptionElement.length > 0
            ? descriptionElement.attr('content')
            : undefined;

        // Keywords
        const keywordsElement = $('meta[name="keywords"]');
        const keywords =
          keywordsElement.length > 0
            ? keywordsElement.attr('content')
            : undefined;

        // Image
        const imageElement = $('meta[property="og:image"]');
        let image =
          imageElement.length > 0 ? imageElement.attr('content') : undefined;

        if (image && image.startsWith('/')) {
          // Handle relative paths
          image = `${jsUrl.protocol}//${jsUrl.host}${image}`;
        }

        // Favicon
        const faviconElement = $(
          'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
        );
        let favicon =
          faviconElement.length > 0 ? faviconElement.attr('href') : undefined;

        if (favicon && favicon.startsWith('/')) {
          // Handle relative paths
          favicon = `${jsUrl.protocol}//${jsUrl.host}${favicon}`;
        } else if (favicon === 'undefined') {
          // Try to find favicon.ico default in root directory
          favicon = `${jsUrl.protocol}//${jsUrl.host}/favicon.ico`;
        }

        return {
          url,
          charset,
          title,
          description,
          keywords,
          image,
          favicon,
        };
      });

    // Validate metadata
    if (metadata.image) {
      metadata.image = (await fetch(metadata.image, { method: 'HEAD' }).then(
        (r) => r.ok,
      ))
        ? metadata.image
        : undefined;
    }
    if (metadata.favicon) {
      metadata.favicon = (await fetch(metadata.favicon, {
        method: 'HEAD',
      }).then((r) => r.ok))
        ? metadata.favicon
        : undefined;
    }

    // Cache metadata
    const cached = cache.set(url, metadata);
    if (!cached) throwServerError('Failed to cache metadata', 500);

    res.set('Cache-Control', 'public, max-age=86400'); // one day
    return res.json(metadata);
  } catch (err) {
    console.error(err);
    const serverError = err as ServerError;
    if (serverError instanceof ServerError) {
      return res.sendStatus(serverError.statusCode || 500);
    }
  }
};
