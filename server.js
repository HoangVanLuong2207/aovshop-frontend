import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Use an environment variable for the backend URL, with a fallback
const BACKEND_URL = process.env.BACKEND_URL || 'https://aovshop-backend.onrender.com';

// Bot User-Agent patterns (Facebook, Zalo, Telegram, Twitter, Discord, etc.)
const BOT_USER_AGENTS = /facebookexternalhit|Facebot|Twitterbot|TelegramBot|Slackbot|LinkedInBot|WhatsApp|Discordbot|ZaloBot|Zalo|bot|crawl|spider|preview/i;

// Resolve product image to absolute URL
function resolveImageUrl(imagePath) {
    if (!imagePath) return 'https://shopregaov.shop/images/hero-bg.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `${BACKEND_URL}/uploads/${imagePath}`;
}

// Escape HTML special characters for safe injection into meta tags
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Fetch product data from backend API
async function fetchProduct(productId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/shop/products/${productId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.error(`[OG] Failed to fetch product ${productId}:`, err.message);
        return null;
    }
}

// Inject dynamic OG meta tags into HTML
function injectOgTags(html, product) {
    const title = escapeHtml(product.name) + ' - AOV Shop';
    const description = escapeHtml(product.description || `Mua ${product.name} tại AOV Shop - Uy tín, tự động 100%`);
    const image = resolveImageUrl(product.image);
    const url = `https://shopregaov.shop/products/${product.id}`;
    const price = product.sale_price || product.price;

    // Replace existing OG tags with dynamic ones
    html = html.replace(
        /<meta property="og:title"[^>]*>/,
        `<meta property="og:title" content="${title}" />`
    );
    html = html.replace(
        /<meta property="og:description"[^>]*>/,
        `<meta property="og:description" content="${description}" />`
    );
    html = html.replace(
        /<meta property="og:image"[^>]*>/,
        `<meta property="og:image" content="${image}" />`
    );
    html = html.replace(
        /<meta property="og:url"[^>]*>/,
        `<meta property="og:url" content="${url}" />`
    );
    html = html.replace(
        /<meta property="og:type"[^>]*>/,
        `<meta property="og:type" content="product" />`
    );

    // Replace page title
    html = html.replace(
        /<title>[^<]*<\/title>/,
        `<title>${title}</title>`
    );

    // Replace meta description
    html = html.replace(
        /<meta name="description"[^>]*>/,
        `<meta name="description" content="${description}" />`
    );

    // Add product price meta (for rich previews)
    const priceMetaTags = `
    <meta property="product:price:amount" content="${price}" />
    <meta property="product:price:currency" content="VND" />`;

    html = html.replace('</head>', `${priceMetaTags}\n</head>`);

    return html;
}

// Health check for cron job ping
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'frontend' });
});

// Proxy /api requests to the backend
app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api', // keep /api in the forwarded path
    },
}));

// Proxy /uploads requests to the backend
app.use('/uploads', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
}));

// Serve static files from dist folder with correct charset
app.use(express.static(path.join(__dirname, 'dist'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        }
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        }
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
        }
        // Security headers for in-app browsers (Zalo, Messenger)
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }
}));

// Handle SPA routing - redirect all routes to index.html
// IMPORTANT: This must be AFTER the /api proxy routes
app.get('*', async (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');

    const userAgent = req.headers['user-agent'] || '';
    const productMatch = req.path.match(/^\/products\/(\d+)$/);

    // If a bot is crawling a product page, inject dynamic OG tags
    if (productMatch && BOT_USER_AGENTS.test(userAgent)) {
        const productId = productMatch[1];
        try {
            const product = await fetchProduct(productId);
            if (product) {
                let html = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf-8');
                html = injectOgTags(html, product);
                console.log(`[OG] Served dynamic meta for product #${productId} to ${userAgent.substring(0, 50)}`);
                return res.send(html);
            }
        } catch (err) {
            console.error(`[OG] Error serving dynamic meta for product #${productId}:`, err.message);
        }
    }

    // Default: serve static index.html
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
    console.log(`Proxying /api to ${BACKEND_URL}`);
    console.log(`[OG] Dynamic meta tags enabled for product pages`);
});
