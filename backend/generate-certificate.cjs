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
      let value = String(data[key] || '');
      
      // Special handling for message to preserve line breaks
      if (key === 'message' && typeof data[key] === 'string') {
        // Convert newlines to HTML line breaks and preserve formatting
        // Each line will be centered individually
        value = value
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('<br>');
      }
      
      // Special handling for font family values - ensure they're properly quoted in CSS
      if (key.includes('FontFamily') && typeof value === 'string' && value.trim()) {
        // All font family values need quotes in CSS (remove existing quotes first)
        value = value.replace(/^['"]|['"]$/g, '').trim();
        if (value) {
          value = `'${value}'`;
        }
      }
      
      // Handle color replacements in SVG (replace # with %23)
      if (typeof value === 'string' && value.includes('#')) {
        // Only replace in specific contexts (like SVG fill attributes)
        const colorRegex = new RegExp(`(fill|color|border-color|background-color):\\s*${value.replace('#', '\\#')}`, 'g');
        result = result.replace(colorRegex, (match) => {
          return match.replace(value, value);
        });
      }
      
      result = result.replace(regex, value);
    }
  });
  
  // CRITICAL: Ensure borderColor is ALWAYS replaced, even if it wasn't in the data object
  // This is a fallback to catch any missed {{borderColor}} variables
  const finalBorderColor = (data.borderColor && String(data.borderColor).trim()) || '#2563b6';
  result = result.replace(/{{\s*borderColor\s*}}/g, finalBorderColor);
  console.error('Replaced {{borderColor}} with:', finalBorderColor);
  
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
  
  return result;
}

async function generateCertificate(data) {
  // Read the HTML template
  const templatePath = path.join(__dirname, 'resources', 'certificate_template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Log received data for debugging
  console.error('Received certificate data:', JSON.stringify({
    backgroundColor: data.backgroundColor,
    accentColor: data.accentColor,
    lightAccentColor: data.lightAccentColor,
    borderColor: data.borderColor,
    showTransparentBox: data.showTransparentBox,
    titleFontFamily: data.titleFontFamily,
    titleFontSize: data.titleFontSize,
    nameFontFamily: data.nameFontFamily,
    nameFontSize: data.nameFontSize,
    messageFontFamily: data.messageFontFamily,
    messageFontSize: data.messageFontSize,
    signatoryFontFamily: data.signatoryFontFamily,
    signatoryFontSize: data.signatoryFontSize,
    backgroundImageUrl: data.backgroundImageUrl,
    designImageUrl: data.designImageUrl,
  }, null, 2));

  // Set default values for customization if not provided
  // Ensure these are always valid strings (not empty strings, null, or undefined)
  data.backgroundColor = (data.backgroundColor && String(data.backgroundColor).trim()) || '#014A9B';
  data.accentColor = (data.accentColor && String(data.accentColor).trim()) || '#F7B737';
  data.lightAccentColor = (data.lightAccentColor && String(data.lightAccentColor).trim()) || '#4AC2E0';
  data.borderColor = (data.borderColor && String(data.borderColor).trim()) || '#2563b6';
  data.showTransparentBox = data.showTransparentBox !== undefined ? data.showTransparentBox : true;
  
  // Log to verify defaults are set
  console.error('Default colors set:', {
    backgroundColor: data.backgroundColor,
    accentColor: data.accentColor,
    lightAccentColor: data.lightAccentColor,
    borderColor: data.borderColor
  });
  // Per-part font settings
  data.titleFontFamily = data.titleFontFamily || 'Playfair Display';
  data.titleFontSize = data.titleFontSize || 'medium';
  data.nameFontFamily = data.nameFontFamily || 'Playfair Display';
  data.nameFontSize = data.nameFontSize || 'medium';
  data.messageFontFamily = data.messageFontFamily || 'Montserrat';
  data.messageFontSize = data.messageFontSize || 'medium';
  data.signatoryFontFamily = data.signatoryFontFamily || 'Montserrat';
  data.signatoryFontSize = data.signatoryFontSize || 'medium';
  
  // Convert font sizes to actual CSS values (matching preview logic)
  const fontSizeMap = {
    small: { title: 2.0, name: 1.8, message: 0.95, signatory: 1.0 },
    medium: { title: 2.5, name: 2.2, message: 1.08, signatory: 1.1 },
    large: { title: 2.8, name: 2.4, message: 1.15, signatory: 1.2 },
  };
  
  data.titleFontSizeValue = fontSizeMap[data.titleFontSize]?.title || fontSizeMap.medium.title;
  data.nameFontSizeValue = fontSizeMap[data.nameFontSize]?.name || fontSizeMap.medium.name;
  data.messageFontSizeValue = fontSizeMap[data.messageFontSize]?.message || fontSizeMap.medium.message;
  data.signatoryFontSizeValue = fontSizeMap[data.signatoryFontSize]?.signatory || fontSizeMap.medium.signatory;
  
  console.error('After defaults - Font settings:', {
    titleFontFamily: data.titleFontFamily,
    titleFontSize: data.titleFontSize,
    titleFontSizeValue: data.titleFontSizeValue,
    nameFontFamily: data.nameFontFamily,
    nameFontSize: data.nameFontSize,
    nameFontSizeValue: data.nameFontSizeValue,
    messageFontFamily: data.messageFontFamily,
    messageFontSize: data.messageFontSize,
    messageFontSizeValue: data.messageFontSizeValue,
    signatoryFontFamily: data.signatoryFontFamily,
    signatoryFontSize: data.signatoryFontSize,
    signatoryFontSizeValue: data.signatoryFontSizeValue,
  });
  
  // Ensure font families are clean strings (no extra whitespace)
  data.titleFontFamily = String(data.titleFontFamily || 'Playfair Display').trim();
  data.nameFontFamily = String(data.nameFontFamily || 'Playfair Display').trim();
  data.messageFontFamily = String(data.messageFontFamily || 'Montserrat').trim();
  data.signatoryFontFamily = String(data.signatoryFontFamily || 'Montserrat').trim();

  // Process background image - convert to base64 (like preview FileReader does)
  if (data.backgroundImageUrl) {
    console.error('Processing background image from:', data.backgroundImageUrl);
    try {
      // Try to read from local storage first (if URL contains /storage/)
      let urlPath;
      try {
        let urlToParse = data.backgroundImageUrl;
        if (urlToParse.includes('localhost')) {
          urlToParse = urlToParse.replace('localhost', '127.0.0.1');
        }
        const urlObj = new URL(urlToParse);
        urlPath = urlObj.pathname;
      } catch (e) {
        urlPath = data.backgroundImageUrl.replace(/^https?:\/\/[^\/]+/, '');
      }
      
      if (urlPath && urlPath.includes('/storage/')) {
        const relativePath = urlPath.replace(/^\/storage\//, '');
        const possiblePaths = [
          path.join(__dirname, '..', 'storage', 'app', 'public', relativePath),
          path.join(__dirname, '..', 'public', 'storage', relativePath),
          path.join(__dirname, 'storage', 'app', 'public', relativePath),
        ];
        
        let storagePath = null;
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            storagePath = possiblePath;
            break;
          }
        }
        
        if (storagePath) {
          console.error('Converting background image to base64 from:', storagePath);
          data.backgroundImageUrl = imageToBase64(storagePath);
        } else {
          // Download via HTTP and convert to base64 (with timeout)
          console.error('Local file not found, downloading via HTTP');
          const https = require('https');
          const http = require('http');
          const url = require('url');
          
          const imageUrl = data.backgroundImageUrl.replace('localhost', '127.0.0.1');
          const parsedUrl = url.parse(imageUrl);
          const client = parsedUrl.protocol === 'https:' ? https : http;
          
          data.backgroundImageUrl = await new Promise((resolve, reject) => {
            const timeout = 5000; // 5 seconds
            const request = client.get(imageUrl, (response) => {
              if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
              }
              const chunks = [];
              response.on('data', (chunk) => chunks.push(chunk));
              response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const base64 = buffer.toString('base64');
                const ext = path.extname(parsedUrl.pathname).slice(1) || 'jpg';
                const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
                resolve(`data:${mime};base64,${base64}`);
              });
              response.on('error', reject);
            });
            
            request.on('error', reject);
            request.setTimeout(timeout, () => {
              request.destroy();
              reject(new Error('Image download timeout'));
            });
          });
        }
      } else {
        // Direct HTTP download
        const https = require('https');
        const http = require('http');
        const url = require('url');
        
        const imageUrl = data.backgroundImageUrl.replace('localhost', '127.0.0.1');
        const parsedUrl = url.parse(imageUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        data.backgroundImageUrl = await new Promise((resolve, reject) => {
          const timeout = 5000;
          const request = client.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`Failed to download: ${response.statusCode}`));
              return;
            }
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              const base64 = buffer.toString('base64');
              const ext = path.extname(parsedUrl.pathname).slice(1) || 'jpg';
              const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
              resolve(`data:${mime};base64,${base64}`);
            });
            response.on('error', reject);
          });
          
          request.on('error', reject);
          request.setTimeout(timeout, () => {
            request.destroy();
            reject(new Error('Image download timeout'));
          });
        });
      }
    } catch (error) {
      console.error('Error processing background image:', error);
      data.backgroundImageUrl = null;
    }
  } else {
    // No custom background - convert default to base64 if exists
    const backgroundPath = path.join(__dirname, 'public', 'Assets', 'background.jpg');
    if (fs.existsSync(backgroundPath)) {
      console.error('Using default background.jpg');
      data.backgroundImageUrl = imageToBase64(backgroundPath);
    } else {
      console.error('No default background.jpg found');
      data.backgroundImageUrl = null;
    }
  }

  // Process design overlay image - convert to base64 (like preview FileReader does)
  if (data.designImageUrl) {
    console.error('Processing design image from:', data.designImageUrl);
    try {
      let urlPath;
      try {
        let urlToParse = data.designImageUrl;
        if (urlToParse.includes('localhost')) {
          urlToParse = urlToParse.replace('localhost', '127.0.0.1');
        }
        const urlObj = new URL(urlToParse);
        urlPath = urlObj.pathname;
      } catch (e) {
        urlPath = data.designImageUrl.replace(/^https?:\/\/[^\/]+/, '');
      }
      
      if (urlPath && urlPath.includes('/storage/')) {
        const relativePath = urlPath.replace(/^\/storage\//, '');
        const possiblePaths = [
          path.join(__dirname, '..', 'storage', 'app', 'public', relativePath),
          path.join(__dirname, '..', 'public', 'storage', relativePath),
          path.join(__dirname, 'storage', 'app', 'public', relativePath),
        ];
        
        let storagePath = null;
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            storagePath = possiblePath;
            break;
          }
        }
        
        if (storagePath) {
          console.error('Converting design image to base64 from:', storagePath);
          data.designImageUrl = imageToBase64(storagePath);
        } else {
          // Download via HTTP and convert to base64
          console.error('Local file not found, downloading via HTTP');
          const https = require('https');
          const http = require('http');
          const url = require('url');
          
          const imageUrl = data.designImageUrl.replace('localhost', '127.0.0.1');
          const parsedUrl = url.parse(imageUrl);
          const client = parsedUrl.protocol === 'https:' ? https : http;
          
          data.designImageUrl = await new Promise((resolve, reject) => {
            const timeout = 5000;
            const request = client.get(imageUrl, (response) => {
              if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
              }
              const chunks = [];
              response.on('data', (chunk) => chunks.push(chunk));
              response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const base64 = buffer.toString('base64');
                const ext = path.extname(parsedUrl.pathname).slice(1) || 'png';
                const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
                resolve(`data:${mime};base64,${base64}`);
              });
              response.on('error', reject);
            });
            
            request.on('error', reject);
            request.setTimeout(timeout, () => {
              request.destroy();
              reject(new Error('Image download timeout'));
            });
          });
        }
      } else {
        // Direct HTTP download
        const https = require('https');
        const http = require('http');
        const url = require('url');
        
        const imageUrl = data.designImageUrl.replace('localhost', '127.0.0.1');
        const parsedUrl = url.parse(imageUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        data.designImageUrl = await new Promise((resolve, reject) => {
          const timeout = 5000;
          const request = client.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`Failed to download: ${response.statusCode}`));
              return;
            }
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              const base64 = buffer.toString('base64');
              const ext = path.extname(parsedUrl.pathname).slice(1) || 'png';
              const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
              resolve(`data:${mime};base64,${base64}`);
            });
            response.on('error', reject);
          });
          
          request.on('error', reject);
          request.setTimeout(timeout, () => {
            request.destroy();
            reject(new Error('Image download timeout'));
          });
        });
      }
    } catch (error) {
      console.error('Error processing design image:', error);
      data.designImageUrl = null;
    }
  } else {
    console.error('No design image URL provided, using default geometric pattern');
  }

  // Process the template with our custom engine
  console.error('Processing template with data keys:', Object.keys(data).join(', '));
  console.error('Font values before template processing:', {
    titleFontFamily: data.titleFontFamily,
    titleFontSize: data.titleFontSize,
    nameFontFamily: data.nameFontFamily,
    nameFontSize: data.nameFontSize,
    messageFontFamily: data.messageFontFamily,
    messageFontSize: data.messageFontSize,
    signatoryFontFamily: data.signatoryFontFamily,
    signatoryFontSize: data.signatoryFontSize,
  });
  console.error('Image values before template processing:', {
    hasBackgroundImageUrl: !!data.backgroundImageUrl,
    hasDesignImageUrl: !!data.designImageUrl,
  });
  html = processTemplate(html, data);
  console.error('Template processed. Sample of processed HTML (first 500 chars):', html.substring(0, 500));
  
  // Final safety check: Ensure borderColor is replaced in the final HTML
  const finalBorderColor = (data.borderColor && String(data.borderColor).trim()) || '#2563b6';
  if (html.includes('{{borderColor}}')) {
    console.error('WARNING: {{borderColor}} still found in HTML after processing! Replacing...');
    html = html.replace(/{{\s*borderColor\s*}}/g, finalBorderColor);
  }
  
  // Verify border is in the final HTML
  const borderCheck = html.match(/border:\s*6px\s+solid\s+[^;]+/);
  console.error('Border in final HTML:', borderCheck ? borderCheck[0] : 'NOT FOUND');

  // Convert disaster_logo.png to base64 if it exists
  const disasterLogoPath = path.join(__dirname, 'public', 'Assets', 'disaster_logo.png');
  if (fs.existsSync(disasterLogoPath)) {
    const dataUrl = imageToBase64(disasterLogoPath);
    if (dataUrl) {
      html = html.replace(/src="[^"]*disaster_logo\.png[^"]*"/g, `src="${dataUrl}"`);
    }
  } else {
    // Try alternative path
    const altLogoPath = path.join(__dirname, '..', 'public', 'Assets', 'disaster_logo.png');
    if (fs.existsSync(altLogoPath)) {
      const dataUrl = imageToBase64(altLogoPath);
      if (dataUrl) {
        html = html.replace(/src="[^"]*disaster_logo\.png[^"]*"/g, `src="${dataUrl}"`);
      }
    }
  }

  // Save the HTML for debugging
  fs.writeFileSync('debug-certificate.html', html);

  console.log('Starting PDF generation...');

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));
    
    // Set content and wait for network to be idle (images and fonts loaded)
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });
    
    // Wait for fonts to load with proper timeout
    try {
      await Promise.race([
        page.evaluate(async () => {
          // Wait for fonts to load
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
          }
          // Also wait for all font faces to be loaded
          if (document.fonts && document.fonts.check) {
            // Check common fonts
            const fontsToCheck = [
              '16px Montserrat',
              '16px Playfair Display',
              '16px Roboto',
              '16px "Open Sans"',
              '16px Lato'
            ];
            let allLoaded = false;
            let attempts = 0;
            while (!allLoaded && attempts < 20) {
              allLoaded = fontsToCheck.every(font => document.fonts.check(font));
              if (!allLoaded) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
              }
            }
          }
        }),
        new Promise((resolve) => setTimeout(resolve, 5000)) // Max 5 seconds for fonts
      ]);
    } catch (e) {
      console.error('Font loading completed or timed out:', e.message);
    }
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true,
      timeout: 30000
    });
    
    console.log(`PDF generated successfully. Size: ${pdfBuffer.length} bytes`);
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Read JSON input from stdin
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  try {
    const data = JSON.parse(input);
    console.error('Node.js received data keys:', Object.keys(data).join(', '));
    console.error('Node.js font data:', {
      titleFontFamily: data.titleFontFamily,
      titleFontSize: data.titleFontSize,
      nameFontFamily: data.nameFontFamily,
      nameFontSize: data.nameFontSize,
      messageFontFamily: data.messageFontFamily,
      messageFontSize: data.messageFontSize,
    });
    const pdf = await generateCertificate(data);
    process.stdout.write(pdf);
  } catch (err) {
    console.error('Node.js error:', err);
    process.stderr.write(err.toString());
    process.exit(1);
  }
}); 