const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}
const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No autenticado' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tiene permisos para esta acción' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole, JWT_SECRET };
