import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Use an environment variable for the backend URL, with a fallback
const BACKEND_URL = process.env.BACKEND_URL || 'https://aovshop-backend.onrender.com';

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
app.get('*', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
    console.log(`Proxying /api to ${BACKEND_URL}`);
});
