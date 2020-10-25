const express = require('express');
const router = express.Router();
const db = require('../dbcon.js');

router.get('/', function (res, req, next) {
    res.render(mylibrary.handlebars)
})

module.exports = router;