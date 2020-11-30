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
var totalRequests = 'SELECT COUNT(id) AS totalRequests FROM Transactions WHERE requestorId = ?'
var updateAboutMe = `UPDATE Users SET aboutMe=? WHERE id=?`;

router.get('/', common.isAuthenticated, (req, res, next) => {
    const userId = req.session.userId
    var payload = { title: 'My Profile' }
    payload.pendingPoints = 0
    payload.availablePoints = 0
    payload.totalPoints = 0
    payload.sentBooks = 0
    payload.receivedBooks = 0

    // get users pending points
    common.getUserPoints(userId, function (err, result) {
        if (err)
        {
            req.flash('error', err)
            return res.render('myprofile', payload)
        }
        payload.pendingPointsPurchase = result.pendingPointsPurchase
        payload.pendingPointsSale = result.pendingPointsSale
        payload.availablePoints = result.availablePoints
        payload.totalPoints = result.totalPoints

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
                            if (result[i].sellerId == userId) { payload.sentBooks++ }
                            else if (result[i].requestorId == userId) { payload.receivedBooks++ }
                        }

                        db.pool.query(totalRequests, [userId], (err, result) => {
                            if (err)
                            {
                                req.flash('error', err)
                                res.render('myprofile', payload)
                            }
                            else
                            {
                                payload.totalRequests = result[0].totalRequests
                                res.render('myprofile', payload)
                            }
                        })                      
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
