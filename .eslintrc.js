module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier', 'standard'],

  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    'prettier/prettier': 'error'
  }
}
