var express = require('express');
var router = express.Router();
var mongoUrl = 'mongodb://localhost:27017/meaieeeias';
//var MongoStore = require('connect-mongo');
var mongo = require('../mongo');
var assert = require('assert');
var port = 80; // for heroku you would use process.env.PORT instead
var fs = require('fs');  // we will need it for file uploads
var multer = require('multer'),
	bodyParser = require('body-parser'),
	path = require('path');
var app = new express();
app.use(bodyParser.json());
//var User = require('../lib/Users');
//Get current date
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();
if(dd<10) {
    dd='0'+dd
} 
if(mm<10) {
    mm='0'+mm
} 
today = yyyy+'-'+mm+'-'+dd;

function getUpdates(){
  var gallery = mongo.collection("updates").find().toArray(function(error, documents) {
    if(error){
      throw error;
    }
    return documents;
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'Home'
  });
});

router.get('/home', function(req, res, next) {
  res.render('index', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'Home'
  });
});

router.get('/index', function(req, res, next) {
  res.render('index', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'Home'
  });
});
//routing for about section
router.get('/about', function(req, res, next) {
  res.render('about', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'About'
  });
});

router.get('/about/ieee', function(req, res, next) {
  res.render('about-ieee', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'About IEEE'
  });
});

router.get('/about/ias', function(req, res, next) {
  res.render('about-ias', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'About IAS'
  });
});

router.get('/about/region10', function(req, res, next) {
  res.render('about-region10', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'About Region 10'
  });
});

router.get('/about/mea', function(req, res, next) {
  res.render('about-mea', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'About MEA Engineering College'
  });
});

router.get('/about/sb', function(req, res, next) {
  res.render('about-sb', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'About MEA IEEE Student Branch'
  });
});

router.get('/about/chapter', function(req, res, next) {
  res.render('about-chapter', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'About MEA IEEE IAS Chapter'
  });
});

//routing for about section ends

router.get('/membership-join', function(req, res, next) {
  res.render('membership-join', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'Membership and Join'
  });
});

router.get('/news', function(req, res, next) {
  res.render('news', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'News and Updates'
  });
});

//events routing starts

router.get('/events', function(req, res, next) {
  var eventList = mongo.collection("events").find().sort({date: -1}).limit(10).toArray(function(error, documents) {
    if (error) {
      res.send('error');
      //throw error;
    }
    res.render('events', { 
        title: 'IEEE IAS Chapter',
        college: 'MEA Engineering College',
        page: 'All Events',
        eventList: documents
    });
  });
});

router.get('/event/:eventid', function(req, res, next) {
  var eventList = mongo.collection("events").find({id: req.params.eventid}).toArray(function(error, documents) {
    if (error) {
      res.send('error');
      //throw error;
    }
    res.render('event-single', { 
        title: 'IEEE IAS Chapter',
        college: 'MEA Engineering College',
        page: 'All Events',
        eventList: documents
    });
  });
});

router.get('/events/page/:pageid', function(req, res, next) {
  res.render('events-sort', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'All Events'
  });
});

router.get('/events/upcoming', function(req, res, next) {
  //{ "carrier.fee": { $gte: 2 }
  var eventList = mongo.collection("events").find({ date: { $gte: today }}).sort({date: -1}).toArray(function(error, documents) {
    if (error) {
      res.send('error');
      //throw error;
    }
    res.render('events-upcoming', { 
        title: 'IEEE IAS Chapter',
        college: 'MEA Engineering College',
        page: 'Upcoming Events',
        eventList: documents
    });
  });
});

router.get('/events/:year', function(req, res, next) {
  var year = req.params.year;
  var eventList = mongo.collection("events").find({year: year}).sort({date: -1}).toArray(function(error, documents) {
    if (error) {
      res.send('error');
      //throw error;
    }
    res.render('events-year', { 
        title: 'IEEE IAS Chapter',
        college: 'MEA Engineering College',
        page: 'Events held in '.concat(req.params.year),
        eventList: documents
    });
  });
});

router.get('/events/event/:event_id', function(req, res, next) {
  res.render('events-single', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: req.params.event_id.concat(' | Event')
  });
});

//routing for events ends

router.get('/members', function(req, res, next) {
  res.render('members', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'Members of our Chapter'
  });
});

//routing for gallery starts

router.get('/gallery', function(req, res, next) {
  //aggregate({$match : { "id" : 300}},{$sort : {"date": 1 }},{$skip : 10},{$limit : 10})
  //db.myCollection.find().skip(200000).limit(5)
  var gallery = mongo.collection("images").find({gallery: "Gallery"}).toArray(function(error, documents) {
      if(error){
        throw error;
      }
      res.render('gallery',{
        title: 'IEEE IAS Chapter',
        college: 'MEA Engineering College',
        page: 'Gallery',
        gallery: documents      
      });
  });
});

//routing for gallery ends

router.get('/contact', function(req, res, next) {
  res.render('contact', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'Contact',
      contact : true,
  });
});

router.get('/login', function(req, res, next) {
  res.render('dashboard/login', { 
      title: 'IEEE IAS Chapter',
      college: 'MEA Engineering College',
      page: 'Dashboard Login'
  });
});

module.exports = router;