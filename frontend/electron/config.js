/**
 * Electron application configuration
 */

const config = {
  // Window settings
  window: {
    main: {
      width: 1400,
      height: 900,
    },
    loading: {
      width: 500,
      height: 350,
    },
  },

  // Server settings
  server: {
    nextjs: {
      dev: {
        url: 'http://localhost:3001',
        port: 3001,
      },
      production: {
        url: 'http://localhost:3002',
        port: 3002,
      },
    },
    python: {
      dev: {
        port: 8000,
      },
      production: {
        port: 8001,
      },
    },
  },

  // Retry settings
  retry: {
    maxRetries: 30,
    interval: 1000, // milliseconds
  },
};

module.exports = config;
