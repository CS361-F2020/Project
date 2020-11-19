const express = require('express');
const router = express.Router();
const db = require('../dbcon.js');
const common = require('../common')

// Book object
function Book(id, title, author, imgUrl, pointcost) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.imgUrl = imgUrl;
    this.pointcost = pointcost
}
                            
// @route   GET /allBooks
// @desc    Get all available books that don't belong to the user and are not undergoing transactions
router.get('/', common.isAuthenticated, (req, res, next) => {
    allBooks( req.session.userId, function(result){
        var payload = result;
        res.render('search', payload);
    })
})

// Get all avaialable books
// ******** need to update this based on worldwide shippers
function allBooks(id, callback){
    var selectAllAvailableBooks = `SELECT UserBooks.id AS id, title AS title, author AS author, imgUrl AS imgUrl
                                 FROM UserBooks
                                 INNER JOIN Books ON Books.id = UserBooks.bookId
                                 WHERE UserBooks.userId != ? AND UserBooks.available = 1`;
    const userId = id;
    var payload = { title: 'Available Books'};
    var books = [];
    db.pool.query(selectAllAvailableBooks, [userId], (err, result) => {
        if (err) {
            // update error handling
            next(err);
            return;
        }
        var number = result.length;
        // ********* need to update the point value 
        for (let i = 0; i < number; i++) {
            books.push(new Book(result[i].id, result[i].title, result[i].author, result[i].imgUrl, 5));           
        }
        payload.books = books;
        // payload.number = number;
        return callback(payload);
    })
}

// @route   POST /home
// @desc    Request a book
router.post('/', common.isAuthenticated, (req, res, next) => {
    const errMsg = 'Error requesting book, please try again.';
    const id = req.body.bookId;
    const title = req.body.title;
    const userId = req.session.userId;
    var date = new Date().toISOString().slice(0, 10);
    
    // set the UserBooks.available to 0 for not available for swaps
    // need to update this to check for worldwide shippers
    db.pool.query('UPDATE UserBooks SET available = 0 WHERE id = ?', [id], (err, result) => {
        if (err) {
            allBooks( userId, function(result){
                var  payload = result;
                req.flash('error', errMsg);
                res.render('search', payload);
            })
        }else {
            // add a new transaction record
            db.pool.query('INSERT INTO Transactions (userBookId, requestorId, statusId, sellerPoints, buyerPoints, created, modified) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, userId, 1, 4, 4, date, date], (err,result) => {
                if (err) {
                    allBooks( userId, function(result){
                        var  payload = result;
                        req.flash('error', errMsg);
                        res.render('search', payload);
                    })
                }else {
                    var transactionId = result.insertId;
                    // add a new transaction status date
                    db.pool.query('INSERT INTO TransactionStatusDates (transactionId, statusId, date) VALUES (?, ?, ?)', [transactionId, 1, date], (err, result) => {
                        if (err) {
                            allBooks( userId, function(result){
                                var  payload = result;
                                req.flash('error', errMsg);
                                res.render('search', payload);
                            })
                        }
                        // database has been updated
                        // send an email to the seller that a book has been requested
                        // **** update text or maybe use html
                        var message = {
                            to: req.session.email,
                            subject: 'Book Request',
                            text: 'You have a new request for ' + title
                        }
                        common.transport.sendMail(message);
                
                        res.json({success: true});
                    });
                }
            });
        }
    });
});

module.exports = router;
