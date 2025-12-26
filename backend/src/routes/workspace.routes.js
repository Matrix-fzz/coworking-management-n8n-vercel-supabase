const express = require('express');
const router = express.Router();
const WorkspaceController = require('../controllers/workspace.controller');
const { validateWorkspace } = require('../middleware/validation.middleware');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.get('/', WorkspaceController.getAll);
router.get('/:id', WorkspaceController.getById);

// Protected routes
router.post('/', authMiddleware, validateWorkspace, WorkspaceController.create);
router.put('/:id', authMiddleware, validateWorkspace, WorkspaceController.update);
router.delete('/:id', authMiddleware, WorkspaceController.delete);
router.get('/user/my-workspaces', authMiddleware, WorkspaceController.getUserWorkspaces);

module.exports = router;