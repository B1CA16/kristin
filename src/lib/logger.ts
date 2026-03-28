/**
 * Structured logger for server actions and API routes.
 * Outputs JSON in production for log aggregation tools.
 * Uses readable format in development.
 */

type LogLevel = 'info' | 'warn' | 'error';

type LogData = Record<string, unknown>;

function log(level: LogLevel, message: string, data?: LogData) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };

  if (process.env.NODE_ENV === 'production') {
    // JSON format for production — parseable by log tools
    console[level](JSON.stringify(entry));
  } else {
    // Readable format for development
    console[level](`[${level.toUpperCase()}] ${message}`, data ?? '');
  }
}

export const logger = {
  info: (message: string, data?: LogData) => log('info', message, data),
  warn: (message: string, data?: LogData) => log('warn', message, data),
  error: (message: string, data?: LogData) => log('error', message, data),
};
