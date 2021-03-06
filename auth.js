function setupAuth(User, app) {
  var passport = require('passport');
  var FacebookStrategy = require('passport-facebook').Strategy;

  // High level serialize/de-serialize configuration for passport
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.
      findOne({ _id : id }).
      exec(done);
  });

  // Facebook-specific
  passport.use(new FacebookStrategy(
    {
      clientID: '229655060826139',
      clientSecret: '59b4dd5fb65b01d86962d58ffdd692f6',
      callbackURL: 'https://mymeanstackapplication.herokuapp.com/auth/facebook/callback'
    },
    function(accessToken, refreshToken, profile, done) {

      console.log(profile);
      // if (!profile.emails || !profile.emails.length) {
      //   return done('No emails associated with this account!');
      // }

      User.findOneAndUpdate(
        { 'data.oauth': profile.id },
        {
          $set: {
            'profile.username': profile.displayName,
            'profile.picture': 'http://graph.facebook.com/' +
              profile.id.toString() + '/picture?type=large'
          }
        },
        { 'new': true, upsert: true, runValidators: true },
        function(error, user) {
          done(error, user);
        });
    }));

  // Express middlewares
  app.use(require('express-session')({
    secret: 'this is a secret'
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Express routes for auth
    app.get('/auth/facebook',
    function(req, res, next) {
      var redirect = encodeURIComponent('/#/');
      console.log(redirect);

      passport.authenticate('facebook',
        {
          scope: ['email'],
          callbackURL: 'https://mymeanstackapplication.herokuapp.com/auth/facebook/callback?redirect=' + redirect
        })(req, res, next);
    });

  app.get('/auth/facebook/callback',
    function(req, res, next) {
      var url = 'https://mymeanstackapplication.herokuapp.com/auth/facebook/callback?redirect=' +
        encodeURIComponent(req.query.redirect);
      passport.authenticate('facebook', { callbackURL: url })(req, res, next);
    },
    function(req, res) {
      res.redirect(req.query.redirect);
    });
}

module.exports = setupAuth;
