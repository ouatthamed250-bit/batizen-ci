const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};