const mongoSanitize = require("express-mongo-sanitize");
const { clean } = require("xss-clean/lib/xss");

const cleanObject = (value) => mongoSanitize.sanitize(clean(value));

module.exports = function sanitizeRequest(req, res, next) {
  if (req.body) {
    req.body = cleanObject(req.body);
  }

  if (req.params) {
    req.params = cleanObject(req.params);
  }

  if (req.query) {
    Object.defineProperty(req, "query", {
      value: cleanObject(req.query),
      writable: true,
      configurable: true,
      enumerable: true
    });
  }

  next();
};
