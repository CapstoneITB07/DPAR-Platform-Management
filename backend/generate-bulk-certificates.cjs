const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Helper function to convert image to base64
function imageToBase64(imagePath) {
  if (fs.existsSync(imagePath)) {
    const base64 = fs.readFileSync(imagePath, 'base64');
    const ext = path.extname(imagePath).slice(1);
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    return `data:${mime};base64,${base64}`;
  }
  return null;
}

// Simple template engine to handle loops and conditionals
function processTemplate(template, data) {
  let result = template;
  
  // Handle for loops: {% for item in items %} ... {% endfor %}
  const forLoopRegex = /{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%}([\s\S]*?){%\s*endfor\s*%}/g;
  result = result.replace(forLoopRegex, (match, itemVar, arrayVar, loopContent) => {
    const array = data[arrayVar];
    if (!Array.isArray(array)) {
      console.log(`Warning: ${arrayVar} is not an array or undefined`);
      return '';
    }
    
    return array.map(item => {
      let itemResult = loopContent;
      // Replace {{item.property}} with actual values
      const itemRegex = new RegExp(`{{\\s*${itemVar}\\.(\\w+)\\s*}}`, 'g');
      itemResult = itemResult.replace(itemRegex, (match, property) => {
        return item[property] || '';
      });
      return itemResult;
    }).join('');
  });
  
  // Handle simple variable replacements: {{variable}}
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string' || typeof data[key] === 'number') {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, data[key] || '');
    }
  });
  
  // Handle special cases like signatures-{{signatories|length}}
  if (data.signatories && Array.isArray(data.signatories)) {
    const lengthRegex = /signatures-{{\s*signatories\s*\|\s*length\s*}}/g;
    result = result.replace(lengthRegex, `signatures-${data.signatories.length}`);
  }
  
  return result;
}

async function generateBulkCertificates(data) {
  // Read the HTML template
  const templatePath = path.join(__dirname, 'resources', 'certificate_template.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

  // Convert background.jpg to base64 and add to data
  const backgroundPath = path.join(__dirname, 'public', 'Assets', 'background.jpg');
  if (fs.existsSync(backgroundPath)) {
    data.backgroundBase64 = imageToBase64(backgroundPath);
  }

  // Convert disaster_logo.png to base64 if it exists
  const disasterLogoPath = path.join(__dirname, 'public', 'Assets', 'disaster_logo.png');
  let logoDataUrl = null;
  if (fs.existsSync(disasterLogoPath)) {
    logoDataUrl = imageToBase64(disasterLogoPath);
  }

  console.log('Starting bulk PDF generation...');

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));
    
    // Generate HTML for all certificates
    let allCertificatesHTML = '';
    
    for (let i = 0; i < data.recipients.length; i++) {
      const recipient = data.recipients[i];
      
      // Create data object for this recipient
      const certificateData = {
        name: recipient.name,
        controlNumber: recipient.controlNumber,
        associate: recipient.name,
        signatories: data.signatories,
        message: data.message,
        logoUrl: data.logoUrl,
        baseUrl: data.baseUrl,
        backgroundBase64: data.backgroundBase64,
      };

      // Process the template for this recipient
      let html = processTemplate(htmlTemplate, certificateData);
      
      // Replace logo URL with base64 if available
      if (logoDataUrl) {
        html = html.replace(/src="[^"]*disaster_logo\.png[^"]*"/g, `src="${logoDataUrl}"`);
      }

      // Add page break between certificates (except for the last one)
      if (i < data.recipients.length - 1) {
        html += '<div style="page-break-after: always;"></div>';
      }
      
      allCertificatesHTML += html;
    }

    // Create complete HTML document
    const completeHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bulk Certificates</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .certificate-page {
            width: 100%;
            height: 100vh;
            position: relative;
          }
        </style>
      </head>
      <body>
        ${allCertificatesHTML}
      </body>
      </html>
    `;

    // Save the HTML for debugging
    fs.writeFileSync('debug-bulk-certificates.html', completeHTML);

    await page.setContent(completeHTML, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true
    });
    
    console.log(`Bulk PDF generated successfully. Size: ${pdfBuffer.length} bytes`);
    return pdfBuffer;
  } catch (error) {
    console.error('Bulk PDF generation error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Read JSON input from stdin
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  const data = JSON.parse(input);
  try {
    const pdf = await generateBulkCertificates(data);
    process.stdout.write(pdf);
  } catch (err) {
    process.stderr.write(err.toString());
    process.exit(1);
  }
}); 