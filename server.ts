import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes can go here if needed in the future
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve static SEO page
  app.get("/dental-clinic-software-india", (req, res, next) => {
    const isProd = process.env.NODE_ENV === "production";
    const filePath = isProd 
      ? path.join(process.cwd(), 'dist', 'dental-clinic-software-india.html')
      : path.join(process.cwd(), 'public', 'dental-clinic-software-india.html');
    
    res.sendFile(filePath, (err) => {
      if (err) {
        next(); // Fallback to React app if file not found
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
