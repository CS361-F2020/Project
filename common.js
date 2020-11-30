const nodemailer = require('nodemailer')
const sql = require('./dbcon.js');

var today = new Date()
var transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'bookswaphelpdesk@gmail.com',
        pass: 'havKo9-xostef-gymnuc'
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

function getUserPoints(userId, callback)
{
    var pendingPoints = `SELECT SUM(u.points) AS pendingPoints, SUM(u.pendingPurchase) AS pendingPurchase, SUM(u.pendingSale) AS pendingSale FROM
                        (SELECT SUM(t.buyerPoints) AS points, SUM(t.buyerPoints) AS pendingPurchase, 0 AS pendingSale FROM Transactions t WHERE requestorId = ? AND closed <> 1
                        UNION
                        SELECT SUM(t.sellerPoints) AS points, 0 AS pendingPurchase, SUM(t.sellerPoints) AS pendingSale FROM Transactions t
                            INNER JOIN UserBooks ub on ub.id = t.userBookId WHERE ub.userId = ? AND closed <> 1) AS u`

    var userPoints = 'SELECT points FROM Users WHERE id = ?'
    sql.pool.query(userPoints, [userId], (err, result) => {
        var data = { }

        if (err)
        {
            return callback(err, '');
        }
        var userPoints = result[0].points
        data.userPoints = userPoints

        sql.pool.query(pendingPoints, [userId, userId], (err, result) => {
            if (err)
            {
                return callback(err, '')
            }
            data.pendingPointsTotal = result[0].pendingPoints
            data.pendingPointsPurchase = result[0].pendingPurchase
            data.pendingPointsSale = result[0].pendingSale
            data.availablePoints = userPoints + result[0].pendingPurchase
            return callback('', data)
        })
    })
}

// Update a user's point total
function updateUserPoints(userId, pointAdj, callback)
{
    var query = 'UPDATE Users SET points = points + ? WHERE id = ?'
    sql.pool.query(query, [pointAdj, userId], (err, result) => {
        if (err) {
            return callback(err)
        }
        return callback(null, result)
    })
}

// Checks if book exists already based on isbn
function bookExists(isbn, callback) {
    var query = 'SELECT id FROM Books WHERE isbn10 = ? OR isbn13 = ?'
    sql.pool.query(query, [isbn, isbn], (err, result) => {
        if (err) {
            return callback(err)
        }
        else if (result.length == 0) {
            return callback(null, false, 0)
        }
        else {
            return callback(null, true, result[0].id)
        }
    })
}

module.exports = {
    isAuthenticated,
    transport,
    updateUserPoints,
    bookExists,
    getUserPoints
}