const express = require('express');
const router = express.Router();
const db = require('../dbcon.js');
const common = require('../common')

//User
function User(firstName, lastName, address, city, state, country, aboutMe, points, booksReceived) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.address = address;
    this.city = city;
    this.state = state;
    this.country = country;
    this.aboutMe = aboutMe;
    this.points = points;
    this.booksReceived = booksReceived;
}

//database queries
const selectUserinfo = `SELECT firstName, lastName, address, city, state, country, aboutMe,  points
                        FROM Users
                        WHERE Users.id = ?`;
const getTransactionInfo = `SELECT  userBookId AS sentBook, requestorId AS receivedBook, rating AS rating
                            FROM Transactions
                            WHERE Transactions.userBookId = ?
                            OR Transactions.requestorId = ?`;
const updateAboutMe = `UPDATE Users SET aboutMe=? WHERE id=?`;

// @route   GET /myprofile
// @desc    Get current users profile
router.get('/', common.isAuthenticated, (req, res, next) => {
    const userId = req.session.userId;
    var payload = {};
    var user = {};
    var sentBooks = 0;
    var receivedBooks = 0;
    db.pool.query(selectUserinfo, [userId], (err, result) => {
        if (err) {
            next(err);
            return;
        } else {
            payload.user = new User(result[0].firstName, result[0].lastName, result[0].address, result[0].city, result[0].state, result[0].country, result[0].aboutMe, result[0].points, result[0].booksReceived);
            if (payload.user.aboutMe == "" || payload.user.aboutMe == null)
            {
                payload.user.aboutMe = "You do not have anything in your About Me, you can change that now by clicking the edit icon!"
            }
            
        }
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
            res.render('myprofile', payload);
        }
    })
     

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
