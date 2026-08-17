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
    const email = req.body.email
    const token = await buffer.toString('hex');
    const user = await User.findOne({email: email});
    if(!user){
      return res.redirect('/reset-password')
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
    res.render('auth/reset-password', {
      pageTitle: 'Reset Password',
      path: '/reset-password',
      error: 'Error on the password reset link'
    });
  }

}

exports.getNewPassword = async (req, res, next) => {
  const token = req.query.token;
  const email = req.query.email;
  const user = await User.findOne({
    email: email,
    resetToken: token,
    resetTokenExpiration: { $gte: Date.now() }
  });

  if(!user){
    return res.render('auth/reset-password', {
      pageTitle: 'Reset Password',
      path: '/reset-password',
      error: 'Invalid reset token or email 2'
    });
  }

  res.render('auth/new-password', {
    pageTitle: 'New Password',
    path: '/new-password',
    email: email,
    token: token
  });
}

exports.postNewPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const email = req.body.email;
  const token = req.body.token;

  if(newPassword !== confirmPassword){
    return res.render('auth/new-password', {
      pageTitle: 'New Password',
      path: '/new-password',
      email: email,
      token: token,
      error: 'Passwords do not match'
    });
  }

  const user = await User.findOne({
    email: email,
    resetToken: token,
    resetTokenExpiration: { $gte: Date.now() }
  });

  if(!user){
    return res.render('auth/new-password', {
      pageTitle: 'New Password',
      path: '/new-password',
      email: email,
      token: token,
      error: 'Invalid reset token or email'
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiration = undefined;
  await user.save();

  res.redirect('/login');

}
