var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/bouncyCircle', function (req, res, next) {
  res.render('bouncyCircle', {title: 'bouncyCircle Sweet bouncyCircle'});
});


module.exports = router;
