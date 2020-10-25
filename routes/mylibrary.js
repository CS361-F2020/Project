const express = require('express');
const router = express.Router();
const db = require('../dbcon.js');

router.route('/')
    .get((req, res, next) => {
        res.render('mylibrary');
    });

module.exports = router;