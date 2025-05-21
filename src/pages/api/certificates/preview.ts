import {NextApiRequest, NextApiResponse } from 'next';
import puppeteer, { PDFOptions } from 'puppeteer';
import {withAdminAuth } from '@/utils/apiAuth';
import {v4 as uuidv4 } from 'uuid';
import {formatDate } from '@/utils/formatters';

/**
 * Interface for certificate template in request body
 */
interface TemplateRequest {
  content?: string;
  htmlTemplate?: string;
  cssStyles?: string;
  orientation?: 'landscape' | 'portrait';
}

/**
 * API endpoint to generate a PDF preview of a certificate template
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    const {template, sampleData } = req.body as {
      template: TemplateRequest;
      sampleData?: Record<string, string>;
    };

    if (!template || (!template.content && !template.htmlTemplate)) {
      return res.status(400).json({error: 'Template content is required'});
  }

    // Default sample data
    const defaultSampleData: Record<string, string> = {
      studentName: 'John Doe',
      courseName: 'Advanced Sales Techniques',
      issueDate: formatDate(new Date().toISOString()),
      completionDate: formatDate(new Date().toISOString()),
      certificateId: uuidv4().substring(0, 8).toUpperCase(),
      verificationCode: 'ABC123XYZ',
      issuerName: 'Jane Smith',
      issuerTitle: 'Director of Training',
      companyName: 'Closer College'
  };

    // Merge default sample data with provided sample data
    const mergedSampleData = {...defaultSampleData, ...(sampleData || {}) };

    // Get the HTML content
    let html: string = template.content || template.htmlTemplate || '';

    // Replace placeholders with sample data
    Object.entries(mergedSampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, value);
    });

    // Add CSS styles if available
    if (template.cssStyles) {
      html = `
        <style>
          ${template.cssStyles}
        </style>
        ${html}
      `;
    }

    // Wrap in HTML document if not already
    const docTypeCheck = typeof html === 'string' && html.includes('<!DOCTYPE html>');
    if (!docTypeCheck) {
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificate Preview</title>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(html, {
      format: 'A4',
      landscape: template.orientation === 'landscape',
      printBackground: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="certificate-preview.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.status(200).send(pdfBuffer);
} catch (error) {
    console.error('Error generating certificate preview:', error);
    res.status(500).json({error: 'Failed to generate certificate preview'});
}
}

/**
 * Options for PDF generation
 */
interface PdfGenerationOptions {
  format?: string;
  landscape?: boolean;
  margin?: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  printBackground?: boolean;
  scale?: number;
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
  pageRanges?: string;
}

/**
 * Generate a PDF from HTML content
 */
async function generatePDF(html: string, options: PdfGenerationOptions = {}): Promise<Buffer> {
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

    // Generate PDF with properly typed options
    const pdfOptions: PDFOptions = {
      format: options.format as 'a4' || 'a4',
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
    };

    const pdfBuffer = await page.pdf(pdfOptions);

    await browser.close();

    // Convert Uint8Array to Buffer
    return Buffer.from(pdfBuffer);
} catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
}
}

// Wrap the handler with authentication middleware
export default withAdminAuth(handler);
