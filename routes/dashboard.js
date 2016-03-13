var express = require('express');
var router = express.Router();
var expressSession = require('express-session');
var expressHbs = require('express3-handlebars');
var mongoUrl = 'mongodb://localhost:27017/meaieeeias';
var MongoStore = require('connect-mongo')(expressSession);
var mongo = require('../mongo');
var assert = require('assert');
var port = 80; // for heroku you would use process.env.PORT instead
var fs = require('fs');  // we will need it for file uploads
var multer = require('multer'),
	bodyParser = require('body-parser'),
	path = require('path');
var app = new express();
app.use(bodyParser.json());
//Get current date
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();
var time = '-' + today.getHours() + '-' + today.getMinutes() + '-' + today.getSeconds();

// This is a middleware that we will use on routes where
// we _require_ that a user is logged in, such as the /secret url
function requireUser(req, res, next){
  if (!req.user) {
    res.redirect('/dashboard/not_allowed');
  } else {
    next();
  }
}

// This middleware checks if the user is logged in and sets
// req.user and res.locals.user routerropriately if so.
function checkIfLoggedIn(req, res, next){
  if (req.session.username) {
    var coll = mongo.collection('users');
    coll.findOne({username: req.session.username}, function(err, user){
      if (user) {
        // set a 'user' property on req
        // so that the 'requireUser' middleware can check if the user is
        // logged in
        req.user = user;
        
        // Set a res.locals variable called 'user' so that it is available
        // to every handlebars template.
        res.locals.user = user;
      }
      
      next();
    });
  } else {
    next();
  }
}

// Use this so we can get access to `req.body` in our posted login
// and signup forms.
router.use( require('body-parser')() );

// We need to use cookies for sessions, so use the cookie parser middleware
router.use( require('cookie-parser')() );

router.use( expressSession({
  secret: 'somesecretrandomstring',
  store: new MongoStore({
    url: mongoUrl
  })
}));

// We must use this middleware _after_ the expressSession middleware,
// because checkIfLoggedIn checks the `req.session.username` value,
// which will not be available until after the session middleware runs.
router.use(checkIfLoggedIn);

//function to create new event
function createEvent(id, name, short, img, report, date, year, callback){
  var coll = mongo.collection('events');
    var query      = {id: id};
    var userObject = {
      id: id,
      name: name,
      short: short,
      img: img,
      report: report,
      date: date,
      year: year
    };
    
    // make sure this id does not exist already
    coll.findOne(query, function(err, user){
      if (user) {
        err = 'The event id you entered already exists';
        callback(err);
      } else {
        // create the new user
        coll.insert(userObject, function(err,user){
          callback(err,user);
        });
      }
    });
}
//function to list events
function eventFind(id, callback){
  var coll = mongo.collection('events');
  coll.findOne({id: id}, function(err, user){
    callback(err, user);
  });
}

router.get('/', requireUser, function(req, res){
  var partials = {
    username: req.session.username,
    page: 'Dashboard'
  }
  res.render('dashboard/index', partials);
});

router.get('/event/add', requireUser, function(req, res){
  var partials = {
    username: req.session.username,
    page: 'Add Event - Dashboard'
  }
  res.render('dashboard/event-add', partials);
});

router.get('/event/edit', requireUser, function(req, res){
  var id = req.query['id'];
  var name = req.query['name'];
  var report = req.query['report'];
  var short = req.query['short'];
  var date = req.query['date'];
  var img = req.query['img'];
  //var year = req.query['year'];
  var partials = {
    username: req.session.username,
    page: 'Update Event - '+name+' - Dashboard',
    id: id,
    name: name,
    report: report,
    short: short,
    date: date,
    img: img
  }
  res.render('dashboard/event-edit', partials);
});

router.post('/event/edit/:id', requireUser, function(req, res){
  var id = req.params.id;
  var name = req.body.name;
  var year = req.body.year;
  var date = req.body.date;
  var short = req.body.short;
  var img = req.body.img;
  var report = req.body.img;
  var col = mongo.collection('events');
  col.updateOne({id: id}, {$set: {name: name}});
  col.updateOne({id: id}, {$set: {year: year}});
  col.updateOne({id: id}, {$set: {date: date}});
  col.updateOne({id: id}, {$set: {short: short}});
  col.updateOne({id: id}, {$set: {img: img}});
  col.updateOne({id: id}, {$set: {report: report}});
  //mongo.collection("events").updateOne({id: id}, {$set:{name: name});
  res.redirect('/dashboard/event/view');
});

router.get('/gallery/add', requireUser, function(req, res){
  var partials = {
    username: req.session.username,
    page: 'Add a Gallery Image- Dashboard'
  }
  res.render('dashboard/gallery-add', partials);
});

router.get('/updates/add', requireUser, function(req, res){
  var partials = {
    username: req.session.username,
    page: 'Add a new Update scroll text - Dashboard'
  }
  res.render('dashboard/update-add', partials);
});

router.post('/updates/add', requireUser, function(req, res){
  var currentDateTime = Date.now();
  var text = req.body.text;
  mongo.collection('updates').insert({text: text, date: currentDateTime});
  res.redirect("/dashboard/updates/add");
});

router.get('/event/view', requireUser, function(req, res){
  mongo.collection('events').remove({id: req.query['id']});
  var eventList = mongo.collection("events").find().sort({date: -1}).toArray(function(error, documents) {
    if (error) {
      throw error;
    }
    res.render('dashboard/event-list',{
      eventList: documents,
      username: req.session.username,
      page: 'Event List - Dashboard'
    })
  });
});

router.get('/images', requireUser, function(req, res){
  console.log(req.query['img']);
  mongo.collection('images').remove({img: req.query['img']});
  var eventList = mongo.collection("images").find().sort({datetime: -1}).toArray(function(error, documents) {
    if (error) {
      throw error;
    }
    res.render('dashboard/image-list',{
      eventList: documents,
      username: req.session.username,
      page: 'Images - Dashboard'
    })
  });
});

router.post('/event/add', requireUser,function(req, res){
  // These two variables come from the form on
  // the views/login.hbs page
  var id = req.body.id;
  var name = req.body.name;
  var short = req.body.short;
  var img = req.body.img;
  var date = req.body.date;
  var year = req.body.year;
  var report = req.body.report;
  
  createEvent(id, name, short, img, report, date, year, function(err, user){
    if (err) {
      res.render('dashboard/event-add', {
        error: err,
        id: id,
        name: name,
        short: short,
        img: img,
        report: report,
        date: date,
        year: year,
        page: 'Add Event - Dashboard'
      });
    } else {
      res.redirect('/dashboard/event/view');  
    }
  });
});

//add images

router.get('/images/add', requireUser, function(req, res) {
     res.render('dashboard/image-add',{
       page: 'Add new Image - Dashboard',
       username: req.session.username
     });
});

function renameFile(name,rename){
  fs.rename('../public/uploads/'+name, '../public/uploads/'+rename, function(err) {
      if ( err ) {
        console.log('ERROR: ' + err);
      }
  });  
}

function renameGalleryFile(name,rename){
  fs.rename('../public/gallery/'+name, '../public/gallery/'+rename, function(err) {
      if ( err ) {
        console.log('ERROR: ' + err);
      }
  });  
}

router.post('/images/add', requireUser, multer({ dest: '../public/uploads/'}).single('upl'), function(req,res){
	//console.log(req.body); //form fields
	/* example output:
	{ title: 'abc' }
	 */
	//res.send(req.file.filename); //form files
	/* example output:
            { fieldname: 'upl',
              originalname: 'grumpy.png',
              encoding: '7bit',
              mimetype: 'image/png',
              destination: './uploads/',
              filename: '436ec561793aa4dc475a88e84776b1b9',
              path: 'uploads/436ec561793aa4dc475a88e84776b1b9',
              size: 277056 }
	 */
	//res.status(204).end();
	var reName = Date.now()+'-'+req.file.originalname;
	//reName = dd+'-'+mm+'-'+yyyy+time+'.jpg';
  var imageName = req.file.filename;
  renameFile(imageName,reName);
  mongo.collection('images').insert({img: '/uploads/'+reName,datetime: Date.now()});
  //res.send(reName);
  res.redirect('/dashboard/images/');
});

router.post('/gallery/add', requireUser, multer({ dest: '../public/gallery/'}).single('upl'), function(req,res){
	//console.log(req.body); //form fields
	/* example output:
	{ title: 'abc' }
	 */
	//res.send(req.file.filename); //form files
	/* example output:
            { fieldname: 'upl',
              originalname: 'grumpy.png',
              encoding: '7bit',
              mimetype: 'image/png',
              destination: './uploads/',
              filename: '436ec561793aa4dc475a88e84776b1b9',
              path: 'uploads/436ec561793aa4dc475a88e84776b1b9',
              size: 277056 }
	 */
	//res.status(204).end();
	var reName = Date.now()+'-'+req.file.originalname;
	//reName = dd+'-'+mm+'-'+yyyy+time+'.jpg';
  var imageName = req.file.filename;
  renameGalleryFile(imageName,reName);
  mongo.collection('images').insert({img: '/gallery/'+reName, gallery: 'Gallery',datetime: Date.now()});
  //res.send(reName);
  res.redirect('/dashboard/images/');
});


router.get('/login', function(req, res){
  var partials = {
    username: req.session.username,
    page: 'Login'
  }
  res.render('dashboard/login');
});

router.get('/logout', requireUser, function(req, res){
  delete req.session.username;
  res.redirect('/dashboard');
});

router.get('/not_allowed', function(req, res){
  var partials = {
    username: req.session.username,
    page: 'Please Log In to Continue'
  }
  res.render('dashboard/login', partials);
});

// The /secret url includes the requireUser middleware.
router.get('/secret', requireUser, function(req, res){
  res.render('secret');
});

/*
router.get('/signup', function(req,res){
  res.render('signup');
});
*/

// This creates a new user and calls the callback with
// two arguments: err, if there was an error, and the created user
// if a new user was created.
//
// Possible errors: the passwords are not the same, and a user
// with that username already exists.
/*
function createUser(username, password, password_confirmation, callback){
  var coll = mongo.collection('users');
  
  if (password !== password_confirmation) {
    var err = 'The passwords do not match';
    callback(err);
  } else {
    var query      = {username:username};
    var userObject = {username: username, password: password};
    
    // make sure this username does not exist already
    coll.findOne(query, function(err, user){
      if (user) {
        err = 'The username you entered already exists';
        callback(err);
      } else {
        // create the new user
        coll.insert(userObject, function(err,user){
          callback(err,user);
        });
      }
    });
  }
}
*/
/*
router.post('/signup', function(req, res){
  // The 3 variables below all come from the form
  // in views/signup.hbs
  var username = req.body.username;
  var password = req.body.password;
  var password_confirmation = req.body.password_confirmation;
  
  createUser(username, password, password_confirmation, function(err, user){
    if (err) {
      res.render('signup', {error: err});
    } else {
      
      // This way subsequent requests will know the user is logged in.
      req.session.username = user.username;
      
      res.redirect('/');  
    }
  });
});
*/

// This finds a user matching the username and password that
// were given.
function authenticateUser(username, password, callback){
  var coll = mongo.collection('users');
  
  coll.findOne({username: username, password:password}, function(err, user){
    callback(err, user);
  });
}

router.post('/login', function(req, res){
  // These two variables come from the form on
  // the views/login.hbs page
  var username = req.body.username;
  var password = req.body.password;
  
  authenticateUser(username, password, function(err, user){
    if (user) {
      // This way subsequent requests will know the user is logged in.
      req.session.username = user.username;
      res.redirect('/dashboard');
    } else {
      res.render('dashboard/login', {
        badCredentials: true,
        page: 'Please Enter Valid Credentials'
      });
    }
  });
});

router.use('/public', express.static('public'));

mongo.connect(mongoUrl, function(){
  console.log('Connected to mongo at: ' + mongoUrl);
})

module.exports = router;