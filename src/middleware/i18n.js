// i18n.js

const i18n = require('i18n');
const path = require('path');

i18n.configure({
  locales: ['en', 'fr', 'es', 'de','ru','pt','tr'], // Add new languages here
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  cookie: 'lang',
  objectNotation: true,
});

module.exports = i18n;
