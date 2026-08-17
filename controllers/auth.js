const crypto = require("crypto");
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const resendPackage = require('resend');

const resendClient = new resendPackage.Resend(process.env.RESEND_API_KEY);

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
  });
};

exports.postLogin = async (req, res, next) => {
  try{
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({email: email})
    if(!user){
      return res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        isAuthenticated: false,
        error: "This credencials are invalid"
      })
    }

    const isPasswordRight = await bcrypt.compare(password, user.password)
    if(!isPasswordRight){
      return res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        isAuthenticated: false,
        error: "This credencials are invalid"
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
  }catch(error){
    console.log(error)
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

    UserAlreadyExists = await User.findOne({email: email})
    if(UserAlreadyExists){
      console.log("This email is already in use")
      return res.render('auth/signup', {
        path: '/signup',
        pageTitle: '/signup',
        isAuthenticated: false,
        error: "This email is already in use"
      })
    }
    if(password !== confirmPassword){
      console.log("The passwords don't match")
      return res.render('auth/signup', {
        path: '/signup',
        pageTitle: '/signup',
        isAuthenticated: false,
        error: "The passwords don't match"
      })
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
    console.log(err)
  }
}


exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: '/signup',
    isAuthenticated: false,
    error: false
  })
}

exports.getResetPassword = (req, res, next) => {
  res.render('auth/reset-password', {
    pageTitle: 'Reset Password',
    path: '/reset-password',
  });
}
exports.postResetPassword = async (req, res, next) => {
  try{
    const buffer = await crypto.randomBytes(32);
    const token = await buffer.toString('hex');
    const user = await User.findOne({email: req.body.email});
    if(!user){
      
    }

    user.resetToken = token;
    user.resetTokenExpiration = token
  }catch(error){
    console.log(error)
    res.render('auth/reset-password', {
      pageTitle: 'Reset Password',
      path: '/reset-password',
      error: 'Error on the password reset link'
    });
  }

}