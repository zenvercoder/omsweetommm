var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Om Sweet Ommm' });
});

router.get('/om', function (req, res, next) {
  res.render('om');
});

module.exports = router;
