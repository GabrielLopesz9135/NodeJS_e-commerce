const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: req.session.isLoggedIn || false,
    error: false
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
