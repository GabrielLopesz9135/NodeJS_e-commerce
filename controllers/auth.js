const crypto = require("crypto");
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const resendPackage = require('resend');
const { validationResult } = require('express-validator');

const resendClient = new resendPackage.Resend(process.env.RESEND_API_KEY);

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    errors: []
  });
};

exports.postLogin = async (req, res, next) => {
  try{
    const email = req.body.email;
    console.log(email)
    const password = req.body.password;
    const errors = validationResult(req).array();

    const user = await User.findOne({email: email})
    if(!user){
      errors.push({value: email, msg:"This email is invalid", path: 'email' })
    }else{
      const isPasswordRight = await bcrypt.compare(password, user.password)
      if(!isPasswordRight){
        errors.push({value: password, msg:"This password is invalid", path: 'password' })
      }
    }

    console.log(errors);
    if(errors.length > 0){
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errors: errors,
        oldInput:{
          email: email, 
          password: password
        }
      })
    }

    req.session.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      cart: user.cart
    };
    req.session.userId = user._id.toString();
    req.session.isLoggedIn = true;
    return req.session.save(err => {
      if (err) {
        console.log(err);
      }
      res.redirect('/');
    });
  }catch(err){
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  }

};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect('/')
  })
}

exports.postSignup = async (req, res, next) => {
  try{
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    console.log(errors.array())
    if(!errors.isEmpty()){
      return res.status(422).render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errors: errors.array(),
        oldInput:{
          email: email, 
          password: password, 
          confirmPassword: req.body.confirmPassword
        }
      })
    }

    if(password !== confirmPassword){
      req.flash('error', "The passwords don't match");
      return res.redirect('/signup');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email: email,
      password: hashedPassword,
      cart: {items: [] }
    });

    await resendClient.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Creation of your account',
      html: '<p>Your account has been created successfully!</p>'
    });

    user.save();
    return res.redirect('/login')
  }catch(err){
    const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  }
}

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errors: [],
  })
}

exports.getResetPassword = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset-password', {
    pageTitle: 'Reset Password',
    path: '/reset-password',
    error: message
  });
}

exports.postResetPassword = async (req, res, next) => {
  try{
    const buffer = await crypto.randomBytes(32);
    const email = req.body.email
    const token = await buffer.toString('hex');
    const user = await User.findOne({email: email});
    if(!user){
      req.flash('error', 'No account with that email found.');
      return res.redirect('/reset-password');
    }
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    await resendClient.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset Password',
      html: ` <p>You requested a password reset.</p>
      <p>Acesse this link to reset your password: <a href="http://localhost:3050/new-password?email=${email}&token=${token}">Reset Password</a></p>`
    });

    res.redirect('/login');

  }catch(error){
    console.log(error)
    const err = new Error('Error on the password reset link');
    err.httpStatusCode = 500;
    return next(err);
  }

}

exports.getNewPassword = async (req, res, next) => {
  try{
    const token = req.query.token;
    const email = req.query.email;
    
    let message = req.flash('error');
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    const user = await User.findOne({
      email: email,
      resetToken: token,
      resetTokenExpiration: { $gte: Date.now() }
    });

    if(!user){
      req.flash('error', 'Invalid reset token or email');
      return res.redirect('/reset-password');
    }

    res.render('auth/new-password', {
      pageTitle: 'New Password',
      path: '/new-password',
      email: email,
      token: token,
      error: message
    });
  }catch(err){
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}

exports.postNewPassword = async (req, res, next) => {
  try{
    const newPassword = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const email = req.body.email;
    const token = req.body.token;

    if(newPassword !== confirmPassword){
      req.flash('error', 'Passwords do not match');
      return res.redirect(`/new-password?email=${email}&token=${token}`);
    }

    const user = await User.findOne({
      email: email,
      resetToken: token,
      resetTokenExpiration: { $gte: Date.now() }
    });

    if(!user){
      req.flash('error', 'Invalid reset token or email');
      return res.redirect(`/new-password?email=${email}&token=${token}`);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.redirect('/login');
  }catch(err){
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error); 
  }
}

