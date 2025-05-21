// Import puppeteer types and use dynamic import only on server-side
import type { Browser, Page } from 'puppeteer';
import type { Buffer as NodeBuffer } from 'buffer';
// Using dynamic import with type assertion for server-side only
const puppeteer = typeof window === 'undefined' ? import('puppeteer') : null;
// Import Node.js Buffer constructor
let BufferClass: typeof NodeBuffer | null = null;
if (typeof window === 'undefined') {
  // Only import on server side
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bufferModule = require('buffer');
  BufferClass = bufferModule.Buffer as typeof NodeBuffer;
}

interface PDFOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  landscape?: boolean;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  printBackground?: boolean;
  scale?: number;
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
  pageRanges?: string;
}

/**
 * Generate a PDF from HTML content (Server-side implementation)
 * @param html HTML content to convert to PDF
 * @param options PDF generation options
 * @returns PDF buffer
 */
const generatePDFServer = async (html: string, options: PDFOptions = {}): Promise<NodeBuffer> => {
  if (!puppeteer || !BufferClass) {
    throw new Error('Puppeteer or Buffer is not available in this environment');
  }

  try {
    const puppeteerModule = await puppeteer;
    const browser: Browser = await puppeteerModule.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page: Page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      margin: options.margin || {
        top: '1cm',
        bottom: '1cm',
        left: '1cm',
        right: '1cm',
      },
      printBackground: options.printBackground !== false,
      scale: options.scale || 1,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      displayHeaderFooter: options.displayHeaderFooter || false,
      pageRanges: options.pageRanges || '',
    });

    // Convert Uint8Array to Buffer
    const buffer = BufferClass.from(pdfBuffer);

    await browser.close();

    return buffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generate a PDF from HTML content (Client-side implementation)
 * @param html HTML content to convert to PDF
 * @param options PDF generation options
 * @returns PDF buffer as Uint8Array
 */
const generatePDFClient = async (html: string, options: PDFOptions = {}): Promise<Uint8Array> => {
  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html, options }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF');
  }

  const data = await response.arrayBuffer();
  return new Uint8Array(data);
};

/**
 * Generate a PDF from HTML content
 * @param html HTML content to convert to PDF
 * @param options PDF generation options
 * @returns PDF buffer (Buffer on server, Uint8Array on client)
 */
export const generatePDF = async (
  html: string,
  options: PDFOptions = {}
): Promise<NodeBuffer | Uint8Array> => {
  if (typeof window !== 'undefined') {
    // TypeScript needs help understanding that this branch returns Uint8Array
    return generatePDFClient(html, options);
  } else {
    // TypeScript needs help understanding that this branch returns Buffer
    return generatePDFServer(html, options);
  }
};

/**
 * Generate a PDF preview image from HTML content (Server-side implementation)
 * @param html HTML content to convert to image
 * @returns Image buffer (PNG) as Buffer
 */
const generatePDFPreviewServer = async (html: string): Promise<NodeBuffer> => {
  if (!puppeteer || !BufferClass) {
    throw new Error('Puppeteer or Buffer is not available in this environment');
  }

  try {
    const puppeteerModule = await puppeteer;
    const browser: Browser = await puppeteerModule.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page: Page = await browser.newPage();

    // Set viewport size (A4 dimensions at 96 DPI)
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 2, // Higher resolution
    });

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate screenshot
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    // Convert Uint8Array to Buffer
    const imageBuffer = BufferClass.from(screenshotBuffer);

    await browser.close();

    return imageBuffer;
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw error;
  }
};

/**
 * Generate a PDF preview image from HTML content (Client-side implementation)
 * @param html HTML content to convert to image
 * @returns Image buffer (PNG) as Uint8Array
 */
const generatePDFPreviewClient = async (html: string): Promise<Uint8Array> => {
  const response = await fetch('/api/generate-pdf-preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF preview');
  }

  const data = await response.arrayBuffer();
  return new Uint8Array(data);
};

/**
 * Generate a PDF preview image from HTML content
 * @param html HTML content to convert to image
 * @returns Image buffer (PNG) (Buffer on server, Uint8Array on client)
 */
export const generatePDFPreview = async (html: string): Promise<NodeBuffer | Uint8Array> => {
  if (typeof window !== 'undefined') {
    // TypeScript needs help understanding that this branch returns Uint8Array
    return generatePDFPreviewClient(html);
  } else {
    // TypeScript needs help understanding that this branch returns Buffer
    return generatePDFPreviewServer(html);
  }
};


