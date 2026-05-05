module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@aria/*'], message: 'packages/shared has zero internal deps — no @aria/* imports allowed' },
        { group: ['../../../apps/*', '../../apps/*'], message: 'packages/shared cannot import from apps/' },
      ]
    }]
  }
};
