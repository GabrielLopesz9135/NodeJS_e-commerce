const express = require('express');
const { check, body } = require('express-validator');
const User = require('../models/user');

const authController = require('../controllers/auth')

const router = express.Router();

router.get('/login', authController.getLogin)
router.post('/login', [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.'),
        body(
            'password',
            'Please enter a paswword with at leat 5 characters and oonly numbers ans text'
        )   
            .isLength({min: 5})
            .isAlphanumeric()
    ],
    authController.postLogin)
router.post('/logout', authController.postLogout)

router.get('/signup', authController.getSignup)
router.post('/signup', 
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom(async (value, { req }) => {
                UserAlreadyExists = await User.findOne({email: value})
                if(UserAlreadyExists){
                    return Promise.reject('This E-mail address already exists');
                }
                return UserAlreadyExists;
            }),
        body(
            'password',
            'Please enter a paswword with at leat 5 characters and oonly numbers ans text'
        )   
            .isLength({min: 5})
            .isAlphanumeric()
    ], 
authController.postSignup)

router.get('/reset-password', authController.getResetPassword)
router.post('/reset-password', authController.postResetPassword)

router.get('/new-password', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

module.exports = router;