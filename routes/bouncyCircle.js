var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/om', function (req, res, next) {
  res.render('om', {title: 'Om Sweet Ommm'});
});


module.exports = router;
