const { register } = require('tsconfig-paths');

// Register path mapping for the compiled output
register({
  baseUrl: './dist',
  paths: {
    '*': ['*']
  }
}); 