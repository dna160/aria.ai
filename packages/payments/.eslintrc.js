module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@aria/db', '@aria/ai'], message: 'packages/payments can only import @aria/shared' },
        { group: ['../../../apps/*'], message: 'packages/payments cannot import from apps/' }
      ]
    }]
  }
};
