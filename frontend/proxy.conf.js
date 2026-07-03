// Dev-server proxy: forwards backend calls so the browser stays same-origin (no CORS).
// Reads .env directly so it works under plain `ng serve`, not just run.cmd.
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const env = {};
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return env;
}

// process.env wins so run.cmd's exported BACKEND_URL still overrides.
const env = { ...loadEnv(path.resolve(__dirname, '.env')), ...process.env };
const portSuffix = env.BACKEND_PORT ? `:${env.BACKEND_PORT}` : '';
const backendHost = (env.BACKEND_IP || 'localhost').trim();
const normalizedBackendHost = backendHost === 'localhost' ? '127.0.0.1' : backendHost;
const target = env.BACKEND_URL || `http://${normalizedBackendHost}${portSuffix}`;

// Backend's Tomcat context path; forwarded as-is (no rewrite).
const context = env.API_CONTEXT || '/lpu-reservation-system';

console.log(`[proxy] ${context} -> ${target}`);

module.exports = {
  [context]: { target, changeOrigin: true, secure: false },
  // Uploaded assets served at the backend root (no context path).
  '/uploads': { target, changeOrigin: true, secure: false },
};
