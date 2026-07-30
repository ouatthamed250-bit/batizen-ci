const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
  info: (...args: unknown[]) => isDev && console.log('[INFO]', ...args),
  error: (...args: unknown[]) => isDev && console.error('[ERROR]', ...args),
};
