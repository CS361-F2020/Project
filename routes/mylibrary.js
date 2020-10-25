const express = require('express');
var router = express.Router();
const db = require('../dbcon.js');

router.route('/')
    .get((req, res, next) => {
        res.render('mylibrary');
    });

module.exports = router;