const express = require('express');

const authController = require('../controllers/auth')

const router = express.Router();

router.get('/login', authController.getLogin)
router.post('/login', authController.postLogin)
router.post('/logout', authController.postLogout)

router.get('/signup', authController.getSignup)
router.post('/signup', authController.postSignup)

router.get('/reset-password', authController.getResetPassword)
router.post('/reset-password', authController.postResetPassword)

<<<<<<< HEAD
router.get('/new-password', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

=======
>>>>>>> 5fad6893b916cff8616c2343d4330efb08f720b1
module.exports = router;