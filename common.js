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
        if (req._parsedOriginalUrl) {
            req.session.path = req._parsedOriginalUrl.href
        }
        res.redirect('/login')
    } else {
        next()
    }
}

function getPoints(userId, callback) {
    const id = userId
    sql.pool.query('SELECT points FROM Users WHERE id = ?', [id], (err, result) => {
        if (err) {
            // do some error handling
            next(err)
            return
        }
        var points = result[0].points
        return callback(points)
    })
}

function getPendingPoints(userId, callback) {
    var outgoing = `SELECT SUM(u.points) AS totalPoints
    FROM 
    (SELECT (SUM(Transactions.buyerPoints) * -1) AS points 
    FROM Transactions 
    WHERE requestorId = ? AND statusId <> 8 
    UNION 
    SELECT SUM(t.buyerPoints) AS points 
    FROM Transactions t 
        INNER JOIN UserBooks ub on ub.id = t.userBookId 
    WHERE ub.userId = ? AND statusId <> 8) AS u`

    sql.pool.query(outgoing, [userId, userId], (err, results) => {
        if (err) {
            throw err
        }
        var totalPoints = results[0].totalPoints
        return callback(totalPoints)
    })
}

module.exports = {
    isAuthenticated,
    getPendingPoints,
    transport,
    getPoints
}

