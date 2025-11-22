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
  
  // Handle if/elif/else conditions - process multiple times to handle nested structures
  let maxIterations = 10;
  let iteration = 0;
  
  while (result.includes('{% if') && iteration < maxIterations) {
    iteration++;
    
    // Handle if/elif/else chains
    const elifPattern = /{%\s*if\s+([^%]+)\s*%}([\s\S]*?)(?:{%\s*elif\s+([^%]+)\s*%}([\s\S]*?))*(?:{%\s*else\s*%}([\s\S]*?))?{%\s*endif\s*%}/g;
    result = result.replace(elifPattern, (match) => {
      // Extract all parts
      const ifMatch = match.match(/{%\s*if\s+([^%]+)\s*%}([\s\S]*?)(?:{%\s*elif|{%\s*else|{%\s*endif)/);
      if (!ifMatch) return match;
      
      const firstCondition = ifMatch[1].trim();
      const firstContent = ifMatch[2];
      
      // Extract elif blocks
      const elifMatches = [...match.matchAll(/{%\s*elif\s+([^%]+)\s*%}([\s\S]*?)(?:{%\s*elif|{%\s*else|{%\s*endif)/g)];
      const conditions = [firstCondition];
      const contents = [firstContent];
      
      elifMatches.forEach(elifMatch => {
        conditions.push(elifMatch[1].trim());
        contents.push(elifMatch[2]);
      });
      
      // Extract else content
      const elseMatch = match.match(/{%\s*else\s*%}([\s\S]*?){%\s*endif\s*%}/);
      const elseContent = elseMatch ? elseMatch[1] : '';
      
      // Evaluate conditions
      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];
        let conditionMet = false;
        
        // Check for variable existence or equality
        if (condition.includes('==')) {
          const [varName, value] = condition.split('==').map(s => s.trim().replace(/['"]/g, ''));
          conditionMet = String(data[varName] || '') === value;
        } else if (condition.includes('backgroundBase64')) {
          conditionMet = !!(data.backgroundBase64 && String(data.backgroundBase64).trim() !== '');
        } else if (condition.includes('backgroundImageUrl')) {
          conditionMet = !!(data.backgroundImageUrl && String(data.backgroundImageUrl).trim() !== '');
        } else if (condition.includes('designImageBase64')) {
          conditionMet = !!(data.designImageBase64 && String(data.designImageBase64).trim() !== '');
        } else if (condition.includes('designImageUrl')) {
          conditionMet = !!(data.designImageUrl && String(data.designImageUrl).trim() !== '');
        } else if (condition.includes('showTransparentBox')) {
          conditionMet = data.showTransparentBox !== false;
        } else {
          const varName = condition.trim();
          conditionMet = data[varName] !== undefined && data[varName] !== null && data[varName] !== false && data[varName] !== '';
        }
        
        if (conditionMet) {
          return contents[i];
        }
      }
      
      return elseContent || '';
    });
    
    // Handle simple if/else (without elif)
    const ifRegex = /{%\s*if\s+([^%]+)\s*%}([\s\S]*?)(?:{%\s*else\s*%}([\s\S]*?))?{%\s*endif\s*%}/g;
    result = result.replace(ifRegex, (match, condition, ifContent, elseContent) => {
      // Skip if already processed (contains elif)
      if (match.includes('elif')) {
        return match;
      }
      
      let conditionMet = false;
      
      if (condition.includes('==')) {
        const [varName, value] = condition.split('==').map(s => s.trim().replace(/['"]/g, ''));
        conditionMet = String(data[varName] || '') === value;
      } else if (condition.includes('backgroundBase64')) {
        conditionMet = !!(data.backgroundBase64 && String(data.backgroundBase64).trim() !== '');
      } else if (condition.includes('backgroundImageUrl')) {
        conditionMet = !!(data.backgroundImageUrl && String(data.backgroundImageUrl).trim() !== '');
      } else if (condition.includes('designImageBase64')) {
        conditionMet = !!(data.designImageBase64 && String(data.designImageBase64).trim() !== '');
      } else if (condition.includes('designImageUrl')) {
        conditionMet = !!(data.designImageUrl && String(data.designImageUrl).trim() !== '');
      } else if (condition.includes('showTransparentBox')) {
        conditionMet = data.showTransparentBox !== false;
      } else {
        const varName = condition.trim();
        conditionMet = data[varName] !== undefined && data[varName] !== null && data[varName] !== false && data[varName] !== '';
      }
      
      return conditionMet ? ifContent : (elseContent || '');
    });
  }
  
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
    if (typeof data[key] === 'string' || typeof data[key] === 'number' || typeof data[key] === 'boolean') {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      let value = data[key] || '';
      
      // Special handling for message to preserve line breaks
      if (key === 'message' && typeof value === 'string') {
        // Convert newlines to HTML line breaks and preserve formatting
        // Each line will be centered individually
        value = value
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('<br>');
      }
      
      result = result.replace(regex, value);
    }
  });
  
  // Handle special cases like signatures-{{signatories|length}}
  if (data.signatories && Array.isArray(data.signatories)) {
    const lengthRegex = /signatures-{{\s*signatories\s*\|\s*length\s*}}/g;
    result = result.replace(lengthRegex, `signatures-${data.signatories.length}`);
  }
  
  // Handle pipe filters like {{variable|replace:'#','%23'}}
  const pipeFilterRegex = /{{\s*(\w+)\s*\|\s*replace:['"]([^'"]+)['"],['"]([^'"]+)['"]\s*}}/g;
  result = result.replace(pipeFilterRegex, (match, varName, search, replace) => {
    const value = data[varName] || '';
    return String(value).replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
  });
  
  // CRITICAL: Ensure borderColor is ALWAYS replaced, even if it wasn't in the data object
  const finalBorderColor = (data.borderColor && String(data.borderColor).trim()) || '#2563b6';
  result = result.replace(/{{\s*borderColor\s*}}/g, finalBorderColor);
  
  return result;
}

async function generateBulkCertificates(data) {
  // Read the HTML template
  const templatePath = path.join(__dirname, 'resources', 'certificate_template.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

  // Set default values for customization if not provided
  // Ensure these are always valid strings (not empty strings, null, or undefined)
  data.backgroundColor = (data.backgroundColor && String(data.backgroundColor).trim()) || '#014A9B';
  data.accentColor = (data.accentColor && String(data.accentColor).trim()) || '#F7B737';
  data.lightAccentColor = (data.lightAccentColor && String(data.lightAccentColor).trim()) || '#4AC2E0';
  data.borderColor = (data.borderColor && String(data.borderColor).trim()) || '#2563b6';
  data.showTransparentBox = data.showTransparentBox !== undefined ? data.showTransparentBox : true;
  // Per-part font settings
  data.titleFontFamily = data.titleFontFamily || 'Playfair Display';
  data.titleFontSize = data.titleFontSize || 'medium';
  data.nameFontFamily = data.nameFontFamily || 'Playfair Display';
  data.nameFontSize = data.nameFontSize || 'medium';
  data.messageFontFamily = data.messageFontFamily || 'Montserrat';
  data.messageFontSize = data.messageFontSize || 'medium';
  data.signatoryFontFamily = data.signatoryFontFamily || 'Montserrat';
  data.signatoryFontSize = data.signatoryFontSize || 'medium';

  // Convert background.jpg to base64 only if no custom background image is provided
  if (!data.backgroundImageUrl) {
    const backgroundPath = path.join(__dirname, 'public', 'Assets', 'background.jpg');
    if (fs.existsSync(backgroundPath)) {
      data.backgroundBase64 = imageToBase64(backgroundPath);
    }
  }

  // Convert custom images to base64 if URLs are provided
  if (data.backgroundImageUrl) {
    console.log('Processing background image from:', data.backgroundImageUrl);
    try {
      // Try to read from local storage first (if URL contains /storage/)
      let urlPath;
      try {
        const urlObj = new URL(data.backgroundImageUrl);
        urlPath = urlObj.pathname;
      } catch (e) {
        // If URL parsing fails, try to extract path manually
        urlPath = data.backgroundImageUrl.replace(/^https?:\/\/[^\/]+/, '');
      }
      
      if (urlPath && urlPath.includes('/storage/')) {
        const relativePath = urlPath.replace('/storage/', '');
        const storagePath = path.join(__dirname, '..', 'storage', 'app', 'public', relativePath);
        if (fs.existsSync(storagePath)) {
          console.log('Reading background image from local storage:', storagePath);
          data.backgroundBase64 = imageToBase64(storagePath);
          console.log('Background image converted to base64 from local file');
        } else {
          throw new Error('Local file not found, trying HTTP download');
        }
      } else {
        // Fall back to HTTP download
        const https = require('https');
        const http = require('http');
        const url = require('url');
        
        const imageUrl = data.backgroundImageUrl;
        const parsedUrl = url.parse(imageUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        data.backgroundBase64 = await new Promise((resolve, reject) => {
          client.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`Failed to download image: ${response.statusCode}`));
              return;
            }
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              const base64 = buffer.toString('base64');
              const ext = path.extname(parsedUrl.pathname).slice(1) || 'jpg';
              const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
              console.log('Background image converted to base64 via HTTP, size:', base64.length);
              resolve(`data:${mime};base64,${base64}`);
            });
            response.on('error', reject);
          }).on('error', reject);
        });
      }
    } catch (error) {
      console.error('Error processing background image:', error);
      data.backgroundImageUrl = null; // Fall back to default
    }
  }

  // Convert design overlay image to base64 if URL is provided
  if (data.designImageUrl) {
    console.log('Processing design image from:', data.designImageUrl);
    try {
      // Try to read from local storage first (if URL contains /storage/)
      let urlPath;
      try {
        const urlObj = new URL(data.designImageUrl);
        urlPath = urlObj.pathname;
      } catch (e) {
        // If URL parsing fails, try to extract path manually
        urlPath = data.designImageUrl.replace(/^https?:\/\/[^\/]+/, '');
      }
      
      if (urlPath && urlPath.includes('/storage/')) {
        const relativePath = urlPath.replace('/storage/', '');
        const storagePath = path.join(__dirname, '..', 'storage', 'app', 'public', relativePath);
        if (fs.existsSync(storagePath)) {
          console.log('Reading design image from local storage:', storagePath);
          data.designImageBase64 = imageToBase64(storagePath);
          console.log('Design image converted to base64 from local file');
        } else {
          throw new Error('Local file not found, trying HTTP download');
        }
      } else {
        // Fall back to HTTP download
        const https = require('https');
        const http = require('http');
        const url = require('url');
        
        const imageUrl = data.designImageUrl;
        const parsedUrl = url.parse(imageUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        data.designImageBase64 = await new Promise((resolve, reject) => {
          client.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`Failed to download image: ${response.statusCode}`));
              return;
            }
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              const base64 = buffer.toString('base64');
              const ext = path.extname(parsedUrl.pathname).slice(1) || 'png';
              const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
              console.log('Design image converted to base64 via HTTP, size:', base64.length);
              resolve(`data:${mime};base64,${base64}`);
            });
            response.on('error', reject);
          }).on('error', reject);
        });
      }
    } catch (error) {
      console.error('Error processing design image:', error);
      data.designImageUrl = null; // Fall back to default pattern
      data.designImageBase64 = null;
    }
  } else {
    console.log('No design image URL provided, using default geometric pattern');
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
      
      // Create data object for this recipient - MUST include all customization options
      const certificateData = {
        name: recipient.name,
        associate: recipient.name,
        signatories: data.signatories,
        message: data.message,
        logoUrl: data.logoUrl,
        baseUrl: data.baseUrl,
        backgroundBase64: data.backgroundBase64,
        backgroundImageUrl: data.backgroundImageUrl,
        designImageUrl: data.designImageUrl,
        designImageBase64: data.designImageBase64,
        // Customization options - CRITICAL: These must be included
        backgroundColor: data.backgroundColor,
        accentColor: data.accentColor,
        lightAccentColor: data.lightAccentColor,
        borderColor: data.borderColor,
        showTransparentBox: data.showTransparentBox,
        // Per-part font settings
        titleFontFamily: data.titleFontFamily,
        titleFontSize: data.titleFontSize,
        nameFontFamily: data.nameFontFamily,
        nameFontSize: data.nameFontSize,
        messageFontFamily: data.messageFontFamily,
        messageFontSize: data.messageFontSize,
        signatoryFontFamily: data.signatoryFontFamily,
        signatoryFontSize: data.signatoryFontSize,
      };

      // Process the template for this recipient
      let html = processTemplate(htmlTemplate, certificateData);
      
      // Replace logo URL with base64 if available
      if (logoDataUrl) {
        html = html.replace(/src="[^"]*disaster_logo\.png[^"]*"/g, `src="${logoDataUrl}"`);
      }

      // Extract only the body content to avoid duplicate head sections and conflicting JavaScript
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        html = bodyMatch[1]; // Get content between <body> tags
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
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;400&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            font-family: 'Montserrat', Arial, sans-serif;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .certificate-container {
            width: 1123px;   /* A4 landscape */
            height: 794px;   /* A4 landscape */
            margin: 0 auto;
            box-sizing: border-box;
            position: relative;
            background-image:
            url('data:image/svg+xml;utf8,<svg width="1123" height="794" xmlns="http://www.w3.org/2000/svg"><g transform="translate(823,494)"><polygon points="0,300 300,0 300,300" fill="%23014A9B" /><polygon points="75,300 300,75 300,135 135,300" fill="%234AC2E0" /><polygon points="0,300 120,300 300,120 300,75" fill="%23F7B737" /></g><g transform="translate(0,494)"><g transform="rotate(90,150,150)"><polygon points="0,300 300,0 300,300" fill="%23014A9B" /><polygon points="75,300 300,75 300,135 135,300" fill="%234AC2E0" /><polygon points="0,300 120,300 300,120 300,75" fill="%23F7B737" /></g></g><g transform="rotate(180,150,150)"><polygon points="0,300 300,0 300,300" fill="%23014A9B" /><polygon points="75,300 300,75 300,135 135,300" fill="%234AC2E0" /><polygon points="0,300 120,300 300,120 300,75" fill="%23F7B737" /></g><g transform="translate(823,0) rotate(270,150,150)"><polygon points="0,300 300,0 300,300" fill="%23014A9B" /><polygon points="75,300 300,75 300,135 135,300" fill="%234AC2E0" /><polygon points="0,300 120,300 300,120 300,75" fill="%23F7B737" /></g></svg>'),
            url('${data.backgroundBase64 || ''}');
            background-size: cover, cover;
            background-position: center, center;
            background-repeat: no-repeat, no-repeat;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 18px;
            left: 18px;
            right: 18px;
            bottom: 18px;
            width: auto;
            height: auto;
            background: rgba(255,255,255,0.78);
            border-radius: 25px;
            box-shadow: 0 4px 32px rgba(0,0,0,0.10);
            z-index: 2;
            padding: 0;
            max-width: 1000px;
            min-height: 540px;
            margin: auto;
          }
          .main-logo {
            position: static;
            display: block;
            margin: 0 auto 8px auto;
            width: 120px;
            height: auto;
            z-index: 5;
          }
          .main-content {
            width: 100%;
            max-width: none;
            text-align: center;
            margin: 0;
            z-index: 3;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: rgba(255,255,255,0.05);
            padding: 0;
            justify-content: flex-start;
            gap: 0;
          }
          .cert-title {
            text-align: center;
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            font-weight: bold;
            letter-spacing: 4px;
            color: #2d3142;
            margin-bottom: 0.2rem;
            padding-top: 0px;
            margin-top: 0.3rem;
          }
          .cert-presentation {
            text-align: center;
            font-size: 1.1rem;
            color: #444;
            font-weight: 400;
            margin-bottom: 0.8rem;
            margin-top: 0.2rem;
          }
          .cert-name {
            text-align: center;
            font-size: 2.2rem;
            font-weight: bold;
            margin-bottom: 0.3rem;
            color: #222;
            font-family: 'Playfair Display', serif;
            margin-top: 0.5rem;
            transition: font-size 0.3s ease;
            word-wrap: break-word;
            max-width: 90%;
            line-height: 1.2;
          }
          .cert-divider {
            border: none;
            border-top: 1px solid #000;
            margin: 0.3rem auto 0.8rem auto;
            width: 60%;
          }
          .cert-body {
            text-align: center;
            font-size: 1.08rem;
            color: #444;
            margin: 0 auto 1.5rem auto;
            max-width: 80%;
            line-height: 1.6;
            margin-top: 0.8rem;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            white-space: pre-line;
            text-align-last: center;
            text-justify: none;
            display: block;
            margin-left: auto;
            margin-right: auto;
            padding: 0;
            box-sizing: border-box;
          }
          .cert-body br {
            display: block;
            content: "";
            margin-top: 0.5rem;
          }
          .cert-footer {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            margin-top: 1rem;
            padding: 0 20px;
            width: 100%;
            box-sizing: border-box;
          }
          .signatures-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: flex-end;
            width: 100%;
            gap: 2rem;
          }
          .signature-item {
            text-align: center;
            font-size: 1.1rem;
            color: #222;
            font-weight: 500;
            flex: 1 1 180px;
            max-width: 200px;
          }
          .signature-item .name {
            font-weight: bold;
          }
          .signature-item hr {
            margin-bottom: 0.3rem;
            width: 100%;
            margin-left: auto;
            margin-right: auto;
          }
          .cert-title-small {
            text-align: center;
            font-size: 1rem;
            color: #222;
            font-weight: 400;
            margin-top: 0.5rem;
          }
          .signatures-1 { justify-content: center; }
          .signatures-2 { justify-content: space-between; }
          .signatures-3 { justify-content: space-between; }
          .signatures-4 { 
            position: relative;
            justify-content: space-between;
            align-items: flex-end;
          }
          .signatures-5 { 
            position: relative;
            justify-content: space-between;
            align-items: flex-end;
          }
          .content-box {
            background: rgba(255,255,255,0.05);
            border: 6px solid ${(data.borderColor && String(data.borderColor).trim()) || '#2563b6'};
            border-radius: 20px;
            padding: 36px 40px;
            margin: 0;
            max-width: 900px;
            width: 80%;
            min-height: 540px;
            position: relative;
            z-index: 4;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding-top: 30px;
          }
        </style>
        <script>
          // Function to adjust font size for all certificates in bulk generation
          function adjustFontSizeForAll() {
            // Adjust all name elements
            const nameElements = document.querySelectorAll('.cert-name');
            nameElements.forEach(nameElement => {
              const text = nameElement.textContent || nameElement.innerText;
              const charCount = text.length;
              
              // Reset to base size first
              nameElement.style.fontSize = '2.2rem';
              
              // If text exceeds 15 characters, reduce font size
              if (charCount > 15) {
                let fontSize = 2.2; // Base font size in rem
                
                // Calculate reduction based on character count
                if (charCount > 25) {
                  fontSize = 1.4; // Very long names
                } else if (charCount > 20) {
                  fontSize = 1.6; // Long names
                } else if (charCount > 15) {
                  fontSize = 1.8; // Medium long names
                }
                
                nameElement.style.fontSize = fontSize + 'rem';
              }
            });

            // Adjust all message body elements
            const messageElements = document.querySelectorAll('.cert-body');
            messageElements.forEach(messageElement => {
              // Reset to base size first
              messageElement.style.fontSize = '1.08rem';
              messageElement.style.lineHeight = '1.6';
              
              // Force a layout update
              messageElement.offsetHeight;
              
              // Calculate approximate line count based on text length and container width
              const text = messageElement.textContent || messageElement.innerText;
              const textLength = text.length;
              
              // Estimate characters per line (approximately 70-80 chars per line at base font size for centered text)
              const baseCharsPerLine = 75;
              const estimatedLines = Math.ceil(textLength / baseCharsPerLine);
              
              // If estimated lines exceed 4, reduce font size
              if (estimatedLines > 4) {
                let fontSize = 1.08; // Base font size in rem
                let lineHeight = 1.6; // Base line height
                
                if (estimatedLines > 8) {
                  fontSize = 0.85; // Very long messages
                  lineHeight = 1.4;
                } else if (estimatedLines > 6) {
                  fontSize = 0.9; // Long messages
                  lineHeight = 1.5;
                } else if (estimatedLines > 5) {
                  fontSize = 0.95; // Medium long messages
                  lineHeight = 1.55;
                } else if (estimatedLines > 4) {
                  fontSize = 1.0; // Slightly long messages
                  lineHeight = 1.6;
                }
                
                messageElement.style.fontSize = fontSize + 'rem';
                messageElement.style.lineHeight = lineHeight;
              }
              
              // Secondary check: Measure actual height and adjust if needed
              setTimeout(() => {
                const containerHeight = messageElement.offsetHeight;
                const lineHeightPx = parseFloat(getComputedStyle(messageElement).lineHeight);
                const actualLines = Math.round(containerHeight / lineHeightPx);
                
                if (actualLines > 4) {
                  const currentFontSize = parseFloat(getComputedStyle(messageElement).fontSize);
                  const reductionFactor = 4 / actualLines;
                  const newFontSize = Math.max(0.8, currentFontSize * reductionFactor);
                  
                  messageElement.style.fontSize = newFontSize + 'px';
                  messageElement.style.lineHeight = Math.max(1.3, 1.6 * reductionFactor);
                }
              }, 50);
            });
          }
          
          // Run on page load
          window.addEventListener('load', adjustFontSizeForAll);
          
          // Also run when DOM is ready
          document.addEventListener('DOMContentLoaded', adjustFontSizeForAll);
          
          // Run again after a short delay to ensure proper rendering
          setTimeout(adjustFontSizeForAll, 100);
        </script>
      </head>
      <body>
        ${allCertificatesHTML}
      </body>
      </html>
    `;

    // Save the HTML for debugging
    fs.writeFileSync('debug-bulk-certificates.html', completeHTML);

    await page.setContent(completeHTML, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for fonts to load (check if document.fonts is available)
    try {
      await page.evaluate(() => {
        return document.fonts.ready;
      });
    } catch (e) {
      // If fonts API not available, wait a short time for fonts to load
      await page.waitForTimeout(500);
    }
    
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