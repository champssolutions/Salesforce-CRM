const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const contactController = require('../controllers/contactController');

router.get('/', accountController.getAllAccounts);
router.get('/:id', accountController.getAccountById);
router.get('/:id/contacts', contactController.getContactsByAccountId);
router.post('/', accountController.createAccount);
router.put('/:id', accountController.updateAccount);
router.patch('/:id', accountController.patchAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
