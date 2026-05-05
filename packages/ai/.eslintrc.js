module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: [], message: 'packages/ai cannot import ' },
        { group: ['@aria/payments'], message: 'packages/ai cannot import @aria/payments' },
        { group: ['../../../apps/*'], message: 'packages/ai cannot import from apps/' }
      ]
    }]
  }
};
