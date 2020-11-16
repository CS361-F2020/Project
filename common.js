const nodemailer = require('nodemailer')
const sql = require('./dbcon.js');

var transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'bookswaphelpdesk@gmail.com',
        pass: 'bookSwapFirst!361'
    }
})

function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login')
    } else {
        next()
    }
}

function getPoints(userId, callback){
    const id = userId
    sql.pool.query('SELECT points FROM Users WHERE id = ?', [id], (err, result) => {
    if (err) {
        // do some error handling
        next(err);
        return;
    }
    var points = result[0].points;
    return callback(points);
    })
}

module.exports = {
    isAuthenticated,
    transport,
    getPoints
}