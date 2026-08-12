const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: req.session.isLoggedIn || false
  });
};

exports.postLogin = (req, res, next) => {
  req.session.isLoggedIn = true;

  User.findById('6a21844af7a28b1d14b2291f')
    .then(user => {
      if (!user) {
        return res.redirect('/login');
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
    })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect('/')
  })
}