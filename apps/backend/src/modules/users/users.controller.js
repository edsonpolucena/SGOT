const {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser
} = require('./users.service');

/**
 * GET /api/users
 * Lista usuários com filtros opcionais
 */
async function listUsers(req, res) {
  try {
    const filters = {
      companyId: req.query.companyId,
      status: req.query.status,
      role: req.query.role
    };

    const users = await getUsers(filters, req.user);
    return res.json(users);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return res.status(500).json({ message: 'Erro ao listar usuários' });
  }
}

/**
 * GET /api/users/:id
 * Busca um usuário por ID
 */
async function getUser(req, res) {
  try {
    const user = await getUserById(req.params.id, req.user);
    return res.json(user);
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Você não tem permissão para visualizar este usuário' });
    }
    console.error('Erro ao buscar usuário:', err);
    return res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
}

/**
 * PUT /api/users/:id
 * Atualiza um usuário
 */
async function updateUserData(req, res) {
  try {
    const updatedUser = await updateUser(req.params.id, req.body, req.user);
    return res.json(updatedUser);
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Você não tem permissão para editar este usuário' });
    }
    if (err.message === 'FORBIDDEN_ROLE_CHANGE') {
      return res.status(403).json({ message: 'Você não tem permissão para alterar para esta role' });
    }
    if (err.message === 'EMAIL_IN_USE') {
      return res.status(409).json({ message: 'Email já está em uso' });
    }
    console.error('Erro ao atualizar usuário:', err);
    return res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
}

/**
 * PATCH /api/users/:id/status
 * Altera apenas o status do usuário
 */
async function changeUserStatus(req, res) {
  try {
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use ACTIVE ou INACTIVE.' });
    }

    const updatedUser = await updateUserStatus(req.params.id, status, req.user);
    return res.json(updatedUser);
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Você não tem permissão para alterar o status deste usuário' });
    }
    if (err.message === 'CANNOT_DEACTIVATE_SELF') {
      return res.status(400).json({ message: 'Você não pode desativar sua própria conta' });
    }
    console.error('Erro ao alterar status do usuário:', err);
    return res.status(500).json({ message: 'Erro ao alterar status do usuário' });
  }
}

/**
 * DELETE /api/users/:id
 * Deleta (inativa) um usuário
 */
async function removeUser(req, res) {
  try {
    const result = await deleteUser(req.params.id, req.user);
    return res.json(result);
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Você não tem permissão para deletar este usuário' });
    }
    if (err.message === 'CANNOT_DELETE_SELF') {
      return res.status(400).json({ message: 'Você não pode deletar sua própria conta' });
    }
    console.error('Erro ao deletar usuário:', err);
    return res.status(500).json({ message: 'Erro ao deletar usuário' });
  }
}

module.exports = {
  listUsers,
  getUser,
  updateUserData,
  changeUserStatus,
  removeUser
};


