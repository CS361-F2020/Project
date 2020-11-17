const nodemailer = require('nodemailer')
const db = require('./dbcon.js');

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


function getPendingPoints(userId){
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

    db.pool.query(outgoing, [userId, userId], (err,results) => {
        if (err) {
            throw err
        }
            var totalPoints = results[0].totalPoints;
            //console.log("sql query has returned results: going to send total points to callback: " + totalPoints)
            return totalPoints;
    })
    //console.log("sql query hasn't finished yet ");
}
module.exports = {
    isAuthenticated,
    getPendingPoints,
    transport
}
