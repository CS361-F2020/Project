const express = require('express');
const router = express.Router();
const db = require('../dbcon.js');
const common = require('../common')

//User
function User(data) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
    this.country = data.country;
    this.aboutMe = data.aboutMe;
    this.points = data.points;
    this.booksReceived = data.booksReceived;
}

//database queries
var selectUserinfo = `SELECT firstName, lastName, address, city, state, country, aboutMe,  points
                        FROM Users
                        WHERE Users.id = ?`;
var getTransactionInfo = 'SELECT t.id, t.requestorId, ub.userId as sellerId\
                          FROM Transactions t INNER JOIN UserBooks ub ON t.userBookId = ub.id\
                          WHERE (t.requestorId = ? AND t.statusId = 4) OR (ub.userId = ? AND statusId IN (3, 4, 7))'
var updateAboutMe = `UPDATE Users SET aboutMe=? WHERE id=?`;

router.get('/', common.isAuthenticated, (req, res, next) => {
    const userId = req.session.userId
    var payload = {}
    payload.pendingPoints = 0
    payload.user
    var sentBooks = 0
    var receivedBooks = 0

    // get users pending points
    common.getPendingPoints(userId, function (result) {
        payload.pendingPoints = result

        // get user info
        db.pool.query(selectUserinfo, [userId], (err, results) => {
            if (err) {
                req.flash('error', err)
                res.render('myprofile', payload)
            } else {
                payload.user = new User(results[0]);
                if (payload.user.aboutMe == "" || payload.user.aboutMe == null) {
                    payload.user.aboutMe = "You do not have anything in your About Me, you can change that now by clicking the edit icon!"
                }

                db.pool.query(getTransactionInfo, [userId, userId], (err, result) => {
                    if (err) {
                        req.flash('error', err)
                        res.render('myprofile', payload)
                    } else {
                        for (let i = 0; i < result.length; i++) {
                            if (result[i].sellerId == userId) { sentBooks++ }
                            else if (result[i].requestorId == userId) { receivedBooks++ }
                        }
                        payload.sentBooks = sentBooks
                        payload.receivedBooks = receivedBooks
                        res.render('myprofile', payload)
                    }
                })
            }
        })
    })


});

router.post('/', common.isAuthenticated, (req, res, next) => {
    var { aboutMe } = req.body;
    db.pool.query(updateAboutMe, [aboutMe, req.session.userId], (err, result) => {
        if (err) {
            req.flash('error', err)
            res.json({ 'update': false })
        } else {
            res.json({ 'update': true });
        }
    });
});

module.exports = router;
