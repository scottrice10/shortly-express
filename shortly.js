var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var Promise = require('bluebird');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

//var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
//var session = require('express-session');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));

//cookie-based authentication
//app.use(cookieSession({
//    keys: ['secret1', 'secret2']
//}));

//app.use(express.session());

app.use(cookieParser())

function restrict(req, res, next) {
  if (req.cookies.login) {
    next();
  } else {
    //req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.get('/', function(req, res) {
  console.log("Cookies: ", req.cookies.login);
  res.render('index');
});

app.get('/create', restrict, function(req, res) {
  res.render('index');
});

app.get('/links',
  function(req, res) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  });

app.post('/links',
  function(req, res) {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.send(404);
    }

    new Link({
      url: uri
    }).fetch().then(function(found) {
      if (found) {
        res.send(200, found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.send(404);
          }

          var link = new Link({
            url: uri,
            title: title,
            base_url: req.headers.origin
          });

          link.save().then(function(newLink) {
            Links.add(newLink);
            res.send(200, newLink);
          });
        });
      }
    });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var pass = req.body.password;

  new User({
    username: username
  }).fetch().then(function(found) {
    if (found) {
      res.redirect("/login");
    } else {
      var user = new User({
        username: username,
        password: pass
      });

      user.save().then(function(newUser) {
        console.log("user created");
        Users.add(newUser);
        res.redirect("/login");
      });
    }
  });
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  var user = req.body.username;
  var pass = req.body.password;

  new User({
      username: user
    })
    .fetch()
    .then(function(user) {
      if (user) {
        util.isValidUser(pass, user.get("password")).then(function(bool) {
          if (bool) {
            res.cookie("login", "value", {
              expires: 0
            });

            res.redirect("/create");
          } else {
            console.log("isValidUser not working");
            res.redirect("/signup");
          }
        }).catch(function(err) {
          console.log(err);
          res.redirect("/signup");
        });
      };
    });
});

app.get('/logout', function(req, res) {
  res.cookie("login", "");
  res.redirect("/");
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({
    code: req.params[0]
  }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
