/**
 * Middleware para autorização baseada em roles
 * Verifica se o usuário tem permissão para acessar a rota
 * 
 * @param {string[]} allowedRoles - Array de roles permitidas
 * @returns {Function} Middleware do Express
 * 
 * @example
 * router.get('/users', requireAuth, authorize(['ACCOUNTING_SUPER', 'CLIENT_ADMIN']), getUsers);
 */
function authorize(allowedRoles) {
  return (req, res, next) => {
    // req.user foi populado pelo middleware requireAuth
    const userRole = req.user?.role;
    
    // Verifica se o usuário está autenticado
    if (!userRole) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado' 
      });
    }
    
    // Verifica se a role do usuário está na lista de roles permitidas
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem permissão para esta ação.',
        details: {
          requiredRoles: allowedRoles,
          yourRole: userRole
        }
      });
    }
    
    // Usuário autorizado, continua para o próximo middleware/controller
    next();
  };
}

module.exports = authorize;







