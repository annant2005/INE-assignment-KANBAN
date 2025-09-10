export function loadEnv() {
  const required = ['DATABASE_URL'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`Missing env vars: ${missing.join(', ')}`);
  }
}
