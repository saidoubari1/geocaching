// serveur/middleware/MiddleWareAuth.js
const jwt = require('jsonwebtoken');

const MiddleWareAuth = (req, res, next) => {
  // Récupérer le token dans le header Authorization
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  // Si pas de token, refuser l'accès
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé - Token manquant' });
  }
  
  try {
    // Vérifier le token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

module.exports = MiddleWareAuth;