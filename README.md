# VibeNet - Frontend Client

This is the decoupled Single Page Application (SPA) frontend for **VibeNet** – a premium social network web application built with a high-contrast charcoal/zinc tech aesthetic.

## 🚀 Features
- **Pure Single Page App (SPA)**: Zero framework dependencies (Vanilla HTML, CSS, and JS).
- **Responsive Layout**: Fluid columns for desktop, collapsed vertical layouts for tablets, and a native-feeling bottom navigation bar for mobile devices.
- **Dynamic Theme Options**: Sleek Dark/Light mode toggle, persistent via `localStorage`.
- **Feed Views**: Global and Following feeds, comments modal, network follower listings, and profile editing.

## 🛠️ Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Start the local server
```bash
npm start
```
The static file server runs at: **`http://localhost:8000`**

---

## 🌐 Production Deployment Configuration

The client communicates with the backend via a dynamic `API_BASE` variable. By default, it detects local environments and falls back to a relative `/api` route in production.

If you deploy the client and server to different domains, configure the API proxy to avoid CORS and connection errors:

### A. Deploying to Vercel
We have configured a reverse proxy in `vercel.json`. Before deploying:
1. Open [`vercel.json`](./vercel.json)
2. Replace `https://YOUR-BACKEND-DEPLOYED-URL.onrender.com` with your live API server URL.

### B. Deploying to Netlify
We have configured redirects in `_redirects`. Before deploying:
1. Open [`_redirects`](./_redirects)
2. Replace `https://YOUR-BACKEND-DEPLOYED-URL.onrender.com` with your live API server URL.

### C. Hardcoded Fallback
If you aren't using a proxy, you can modify `API_BASE` directly at the top of [`app.js`](./app.js):
```javascript
const API_BASE = 'https://your-api.onrender.com/api';
```
