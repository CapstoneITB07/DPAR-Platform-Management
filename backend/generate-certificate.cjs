const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Helper to convert image URL to base64 data URL if it's a local asset
function toBase64IfLocal(url) {
  if (url && url.startsWith('http://127.0.0.1:8000/Assets/')) {
    const imgPath = path.join(__dirname, 'public', 'Assets', path.basename(url));
    if (fs.existsSync(imgPath)) {
      const ext = path.extname(imgPath).slice(1);
      const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
      const base64 = fs.readFileSync(imgPath, 'base64');
      console.log(`Embedding image: ${imgPath} as base64`);
      return `data:${mime};base64,${base64}`;
    } else {
      console.log(`Image not found: ${imgPath}`);
    }
  }
  return url;
}

async function generateCertificate(data) {
  // Read the HTML template
  const templatePath = path.join(__dirname, 'resources', 'certificate_template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Convert image URLs to base64 if local
  ['logoUrl', 'swirlTopUrl', 'swirlBottomUrl', 'medalUrl'].forEach(key => {
    if (data[key]) {
      data[key] = toBase64IfLocal(data[key]);
    }
  });

  // Replace placeholders with actual data
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, data[key] || '');
  });

  // Save the HTML for debugging
  fs.writeFileSync('debug-certificate.html', html);

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 90000 });
  // Explicitly wait for all images to load
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        const timeout = setTimeout(resolve, 2000); // 2 seconds max per image
        img.onload = img.onerror = () => {
          clearTimeout(timeout);
          resolve();
        };
      });
    }));
  });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    landscape: true
  });
  await browser.close();
  return pdfBuffer;
}

// Read JSON input from stdin
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  const data = JSON.parse(input);
  try {
    const pdf = await generateCertificate(data);
    process.stdout.write(pdf);
  } catch (err) {
    process.stderr.write(err.toString());
    process.exit(1);
  }
}); 