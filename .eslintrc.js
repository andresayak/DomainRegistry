module.exports = {
  'root': true,
  'env': {
    'node': true,
    'es2021': true,
    'jest': true
  },
  'extends': [
    'eslint:recommended'
  ],
  'overrides': [
    {
      'env': {
        'node': true
      },
      'files': [
        '.eslintrc.{js,cjs}'
      ],
      'parserOptions': {
        'sourceType': 'script'
      }
    }
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
  },
  'rules': {
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'max-len': ['error', {'code': 180}]
  }
}