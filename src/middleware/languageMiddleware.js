
const i18n = require('./i18n');

module.exports = function(req, res, next) {
  // Determine language preference, e.g., from cookies or session
  const lang = req.cookies.lang || 'en'; // Default to 'en' if not set
  
  // Set language for this request

  i18n.setLocale(lang);
  
  next();
};
