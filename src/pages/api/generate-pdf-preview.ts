import {NextApiRequest, NextApiResponse } from 'next';
// Import puppeteer dynamically to avoid client-side issues
import puppeteer from 'puppeteer';
import {withAuth } from '@/utils/apiAuth';

// Configure API to handle larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
  },
},
};

/**
 * API endpoint to generate a PDF preview image from HTML content
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    const {html } = req.body as { html: string };

    if (!html) {
      return res.status(400).json({error: 'HTML content is required'});
    }

    // Generate PDF preview
    const imageBuffer = await generatePDFPreview(html);

    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="certificate-preview.png"');
    res.setHeader('Content-Length', imageBuffer.length);

    // Send image buffer
    res.status(200).send(imageBuffer);
} catch (error) {
    console.error('Error generating PDF preview:', error);
    res.status(500).json({error: 'Failed to generate PDF preview'});
}
}

/**
 * Generate a PDF preview image from HTML content
 */
async function generatePDFPreview(html: string): Promise<Buffer> {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

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

    await browser.close();

    // Convert Uint8Array to Buffer
    return Buffer.from(screenshotBuffer);
} catch (error) {
    console.error('Error generating PDF preview:', error);
    throw error;
}
}

// Wrap the handler with authentication middleware
export default withAuth(handler);
