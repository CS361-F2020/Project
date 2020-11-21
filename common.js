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
    (SELECT (SUM(Transactions.pointCost) * -1) AS points 
    FROM Transactions 
    WHERE requestorId = ? AND statusId <> 8 
    UNION 
    SELECT SUM(t.pointCost) AS points 
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

// Update a user's point total
function updateUserPoints(userId, pointAdj, callback)
{
    var query = 'UPDATE Users SET points = points + ? WHERE id = ?'
    sql.pool.query(query, [pointAdj, userId], (err) => {
        if (err) {
            return callback(err, false)
        }
        return callback('', true)
    })
}

// Checks if book exists already based on isbn
function bookExists(isbn, callback) {
    var query = 'SELECT id FROM Books WHERE isbn10 = ? OR isbn13 = ?'
    sql.pool.query(query, [isbn, isbn], (err, result) => {
        if (err) {
            return callback(err, '', 0)
        }
        else if (result.length == 0) {
            return callback('', false, 0)
        }
        else {
            return callback('', true, result[0].id)
        }
    })
}

module.exports = {
    isAuthenticated,
    transport,
    getPoints,
    getPendingPoints,
    updateUserPoints,
    bookExists
}

