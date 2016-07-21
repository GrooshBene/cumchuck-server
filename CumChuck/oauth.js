module.exports = init;
function init(app, User) {
    var multer= require('multer');

    var mongoose = require('mongoose');
  var passport = require('passport');
  var FacebookExtension = require('passport-facebook-extension');
  var graph = require('fbgraphapi');
  app.use(passport.initialize());
  app.use(passport.session());
  var TwitterStrategy = require('passport-twitter').Strategy;
  var FacebookTokenStrategy = require('passport-facebook-token');
  var TwitterTokenStrategy = require('passport-twitter-token');
  var data_base = mongoose.connection;
mongoose.connect("mongodb://localhost:27017/cumchuck", function(err){
  if(err){
    console.log("MongoDB Error!");
    throw err;
  }
});

    var upload = multer({
        dest : './uploads/',
        rename  : function(fieldname, filename){
            return 'reviewFiles_' + filename;
        }
    });
  var schema = mongoose.Schema;

  passport.serializeUser(function(user, done) {
   done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
   done(null, obj);
  });

  passport.use(new TwitterTokenStrategy({
      consumerKey: "buJ5UkN67J0SCqyxi90uk8IzN",
      consumerSecret: "cbV8N0c9KWSNcQvdDe3w7DzGEXyo9wKlFSH0gHf0MVFY1QsPjq"
    }, function(token, tokenSecret, profile, done) {
      User.findOne({
        'id' : profile.id
      }, function(err, user){
        if(err){
          return done(err);
        }
        if(!user){
          user = new User({
            id : profile.id,
            name : profile.displayName,
            profile : profile.photos,
            gender : profile.gender,
            exp : 0,
            level : 0,
              favorite : []

          });
          user.save(function(err){
            if(err) console.log(err);
            return done(err, profile);
          });
        } else {
          return done(err, profile);
        }
      })
    }));

 passport.use(new FacebookTokenStrategy({
  clientID: "504577693083258",
  clientSecret: "1c6a6a8d11a3455bdb34d99da32ca070",
  profileFields: ['id', 'displayName', 'photos', 'email', 'gender', 'permissions']
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOne({
        'id' : profile.id
      }, function(err, user){
        if(err){
          return done(err);
        }
        if(!user){
          user = new User({
            id : profile.id,
            name : profile.displayName,
            profile : profile.photos,
            gender : profile.gender,
            exp : 0,
            level : 0,
            favorite : []
          });
          user.save(function(err){
            if(err) console.log(err);
            else{
        done(null, profile);
      }
    })
        }
      else if(user){
          done(null, profile);
        }
      })
  }));



app.get('/auth/facebook/token',
  passport.authenticate('facebook-token', {session : false, scope : ['user_friends', 'manage_pages']}),
  function(req, res){
    if(req.user){
      //업데이트 추가
      res.send(200, req.user);
    }
    else if(!req.user){
      res.send(401, req.user);
    }
  }
);

  app.get('/auth/twitter/token',
  passport.authenticate('twitter-token'),
    function(req,res) {
      if (req.user) {
        //업데이트 추가
        res.send(200, req.user);
      }
      else if(!req.user){
        res.send(401, req.user);
      }
    });

  app.get('/auth/facebook/callback', passport.authenticate('facebook-token', {
    successRedirect: '/',
    failureRedirect: '/'
  }));

  app.get('/auth/twitter/callback', passport.authenticate('twitter-token', {
    successRedirect: '/',
    failureRedirect: '/'
  }));

  app.get('/auth/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  app.post('/auth/mypage', function(req,res){
    User.findOne({
      'id' : req.params.id
    }, function(err,result){
      if(err){
        res.send(400, err)  ;
        throw err;
        console.log(err);
      }
      else {
          res.send(result);
      }
    })
  })

  app.get('/auth/user/getFriendList',function (req, res) {
      var fb = new graph.Facebook(req.param('access_token'), 'v2.2');
      // fb.getAppFriends(function (err, result) {
      //       console.log(result);
      //       res.send(200, result);
      // })
      User.find({}, function (err, result) {
          if(err){
              console.log(err);
              throw err;
          }
          res.send(200, result);
      })

  });

  app.get('/auth/user/showFriendInfo', function(req,res){
        User.find({id : req.param('friendid')}, function (err, result) {
            if(err){
                res.send(400, "Failed");
                throw err;
                console.log(err);
            }
            else{
                res.send(200, result);
            }
        })
  });

  app.get('/user/userSelfInfo', function (req,res) {
      var fb = new graph.Facebook(req.param('access_token'), 'v2.2');
      fb.me(function(err, me) {
          console.log(me);
          res.send(200, me);
      });
  });

  app.post('/auth/user/destroyUser',passport.authenticate('facebook-token'), function(req,res){
          if(req.user){
              User.find({id : req.user.id}, function(err,result){
                  if(err){
                      throw err;
                      console.log(err);
                  }
                  else {
                      res.send(200, result);
                  }
              }).remove();
          }
          else if(!req.user){
              res.send(401, req.user);
          }
  });


  //function end
}
