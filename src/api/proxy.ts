import * as cheerio from 'cheerio';
import { throwServerError, ServerError, isAuthenticated } from './utils.js';
import { Request, Response } from 'express';
import puppeteer from 'puppeteer';

const megaScraperArgs = (options: { width?: number; height?: number }) => [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-infobars',
  '--single-process',
  '--no-zygote',
  '--no-first-run',
  `--window-size=${options.width || 1280},${options.height || 800}`,
  '--window-position=0,0',
  '--ignore-certificate-errors',
  '--ignore-certificate-errors-skip-list',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--hide-scrollbars',
  '--disable-notifications',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-component-extensions-with-background-pages',
  '--disable-extensions',
  '--disable-features=TranslateUI,BlinkGenPropertyTrees',
  '--disable-ipc-flooding-protection',
  '--disable-renderer-backgrounding',
  '--enable-features=NetworkService,NetworkServiceInProcess',
  '--force-color-profile=srgb',
  '--metrics-recording-only',
  '--mute-audio',
];

export default async (req: Request, res: Response) => {
  let browser;
  try {
    // Check for API key
    if (!isAuthenticated(req)) throwServerError('Forbidden', 401);

    const url = req.query.url as string;
    if (url === undefined) throwServerError('Missing URL', 400);

    // validate URL
    const jsUrl = new URL(url); // will throw if invalid
    if (jsUrl.protocol !== 'http:' && jsUrl.protocol !== 'https:')
      throwServerError('Invalid URL', 400);

    // Puppeteer is a headless browser that can render web pages
    // and resolves a lot of issues with javascript and weird
    // web pages.
    browser = await puppeteer.launch({
      timeout: 120000, // 2 minutes,
      args: megaScraperArgs({}),
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const html = await page.content();

    // Using cherrio to manipulate the DOM, we add a base tag
    // to the head of the document to ensure that relative URLs
    // are resolved correctly.
    const $ = cheerio.load(html);
    $('head').prepend(
      `<base href="${jsUrl.protocol + '//' + jsUrl.hostname}">`,
    );

    // Remove the script tags from the document
    $('script:not([type])').remove();
    $('script[type*="javascript"]').remove();
    $('link[rel=import]').remove();

    // Set the cache control header to cache the page for one day
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send($.html());
  } catch (err) {
    console.error(err);
    const serverError = err as ServerError;
    if (serverError instanceof ServerError) {
      return res.sendStatus(serverError.statusCode || 500);
    }

    return res.sendStatus(500);
  } finally {
    if (browser) await browser.close();
  }
};
