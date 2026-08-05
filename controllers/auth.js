exports.getLogin = (req, res, next) => {
  const cookies = req.get('Cookie') ? req.get('Cookie').split('; ') : [];
  const loggedInCookie = cookies.find(cookie => cookie.startsWith('loggedIn='));

  const isLoggedIn = loggedInCookie ? loggedInCookie.split('=')[1] === 'true' : false;
  res.render('auth/login', {
    pageTitle: "Login",
    path: '/login',
    isAuthenticated: isLoggedIn
  });
};

exports.postLogin = (req, res, next) => {
    req.session.isLoggedIn = true;
    res.redirect('/');
}