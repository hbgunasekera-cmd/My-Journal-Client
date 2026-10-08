import { Buffer } from 'node:buffer'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function localTranslationApi() {
  return {
    name: 'local-translation-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/translate-content', (req, res, next) => {
        let rawBody = '';
        let bodyBytes = 0;
        let bodyTooLarge = false;

        req.setEncoding('utf8');
        req.on('data', (chunk) => {
          bodyBytes += Buffer.byteLength(chunk);
          if (bodyBytes > 32_000) {
            bodyTooLarge = true;
            rawBody = '';
          } else if (!bodyTooLarge) {
            rawBody += chunk;
          }
        });

        req.on('end', async () => {
          if (bodyTooLarge) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Article is too long to translate.' }));
            return;
          }

          try {
            req.body = rawBody ? JSON.parse(rawBody) : {};
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Request body must be valid JSON.' }));
            return;
          }

          res.status = (statusCode) => {
            res.statusCode = statusCode;
            return res;
          };
          res.json = (payload) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(payload));
            return res;
          };

          try {
            const { default: handler } = await server.ssrLoadModule('/api/translate-content.js');
            await handler(req, res);
            if (!res.writableEnded) res.end();
          } catch (error) {
            next(error);
          }
        });

        req.on('error', next);
      });
    },
  };
}

// Keep ARTICLE_KEY in the Node dev-server process; never expose it through import.meta.env.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (!process.env.ARTICLE_KEY && env.ARTICLE_KEY) {
    process.env.ARTICLE_KEY = env.ARTICLE_KEY;
  }

  return {
    plugins: [react(), localTranslationApi()],
  };
});
