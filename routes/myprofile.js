const express = require('express');
const router = express.Router();
const db = require('../dbcon.js');
const common = require('../common')

//User
function User(firstName, lastName, city, state, country, aboutMe, points, booksReceived) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.city = city;
    this.state = state;
    this.country = country;
    this.aboutMe = aboutMe;
    this.points = points;
    this.booksReceived = booksReceived;
}

//database queries
const selectUserinfo = `SELECT firstName AS firstName, lastName AS lastName, city AS city, state AS state, country AS country, aboutMe AS aboutMe,  points AS points
                        FROM Users
                        WHERE Users.id = ?`;
const getTransactionInfo = `SELECT  userBookId AS sentBook, requestorId AS receivedBook, rating AS rating
                            FROM Transactions
                            WHERE Transactions.userBookId = ?
                            OR Transactions.requestorId = ?`;
const updateAboutMe = `UPDATE Users SET aboutMe=? WHERE id=?`;

// work around function for async
function count(res, payload, counter, num){
    if(counter == num){
        res.render('myprofile', payload);
    }
}

// @route   GET /myprofile
// @desc    Get current users profile
router.get('/', common.isAuthenticated, (req, res, next) => {
    const userId = req.session.userId;
    var payload = {};
    payload.pendingPoints = 0;
    payload.user;
    var sentBooks = 0;
    var receivedBooks = 0;
    var counter = 0;

    // get users pending points
    common.getPendingPoints(userId, function(result){
        payload.pendingPoints = result;
        counter++;
        count(res, payload, counter, 3);
    })
    // get user info
    db.pool.query(selectUserinfo, [userId], (err, result) => {
        if (err) {
            next(err);
            return;
        } else {
            payload.user = new User(result[0].firstName, result[0].lastName, result[0].city, result[0].state, result[0].country, result[0].aboutMe, result[0].points, result[0].booksReceived);
            counter++;
            count(res, payload, counter, 3);            
        }
    })
    // get transaction record
    db.pool.query(getTransactionInfo, [userId, userId], (err, tranResult) => {
        if (err) {
            next(err);
            return;
        } else {
            for(let i = 0; i < tranResult.length; i++) {
                if (tranResult[i].sentBook == userId) { sentBooks++; }
                else if (tranResult[i].receivedBook == userId) { receivedBooks++; }  
            }
            payload.sentBooks = sentBooks;
            payload.receivedBooks = receivedBooks;
            counter++;
            count(res, payload, counter, 3);
        }
    })
});

// @route   PUT /myprofile
// @desc    updates about me
router.post('/', common.isAuthenticated, (req, res, next) => {
    var { aboutMe } = req.body;
    db.pool.query(updateAboutMe, [aboutMe, req.session.userId], (err, result) => {
        if (err) {
            next(err);
            return;
        } else { 
            res.json({ 'update': true }); 
        }    
    });
});

module.exports = router;
