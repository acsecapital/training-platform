import {NextApiRequest, NextApiResponse } from 'next';
// Import puppeteer with proper typing
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
 * API endpoint to generate a PDF from HTML content
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    // Type the request body properly
    const {html, options } = req.body as {
      html: string;
      options?: PDFOptions;
    };

    if (!html) {
      return res.status(400).json({error: 'HTML content is required'});
  }

    // Generate PDF
    const pdfBuffer = await generatePDF(html, options || {});

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.status(200).send(pdfBuffer);
} catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({error: 'Failed to generate PDF'});
}
}

/**
 * Generate a PDF from HTML content
 */
async function generatePDF(html: string, options: PDFOptions = {}): Promise<Buffer> {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF with proper puppeteer options
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

    await browser.close();

    // Convert to Buffer if it's not already
    return Buffer.from(pdfBuffer);
} catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
}
}

// Wrap the handler with authentication middleware
export default withAuth(handler);
