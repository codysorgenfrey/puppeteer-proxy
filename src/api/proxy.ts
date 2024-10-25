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

    const response = {
      page: '',
      url,
    };

    // Puppeteer is a headless browser that can render web pages
    // and resolves a lot of issues with javascript and weird
    // web pages.
    browser = await puppeteer.launch({
      args: megaScraperArgs({}),
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0',
    );
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
    response.page = await page.content();
    response.url = page.url();

    return res.json(response);
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
