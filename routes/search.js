const express = require('express');
const router = express.Router();
const db = require('../dbcon.js');
const common = require('../common')

// Book object
function Book(data) {
    this.id = data.id;
    this.title = data.title;
    this.author = data.author;
    this.imgUrl = data.imgUrl;
    this.pointcost = data.pointcost;
    this.isbn = data.isbn;
    this.genre = data.genre;
    this.rating = data.rating;
    this.pubDate = data.pubDate;
    this.userPoints = data.userPoints;
    this.condition = data.condition;
    this.date = data.date;
    this.copies = data.copies;
}

//Glenn: I was testing out character removal with this function. 
//I think it works a little better than the one from the stack overflow post provided the other day
//maybe a good candidate for handling characters?
function replaceCharacters(userText) {
    var regExpr = /[^a-zA-Z0-9-. ]/g;
    
    return userText.replace(regExpr, "");
}

        
// @route   GET /allBooks
// @desc    Get all available books that don't belong to the user and are not undergoing transactions
router.get('/', common.isAuthenticated, (req, res, next) => {
    allBooks(req.session.userId, function(result) {
        var payload = result;
        res.render('search', payload);
    })
})

// Get all avaialable books
// ******** need to update this based on worldwide shippers
function allBooks(id, callback){
    var selectAllAvailableBooks = `SELECT UserBooks.id AS id, listingDate, description, title AS title, author AS author, imgUrl AS imgUrl, isbn13 AS isbn, Users.country
                                FROM UserBooks
                                INNER JOIN Conditions ON Conditions.id = UserBooks.conditionId
                                INNER JOIN Books ON Books.id = UserBooks.bookId
                                INNER JOIN Users ON Users.id = UserBooks.userId
                                WHERE UserBooks.userId != 1 AND UserBooks.available = 1 AND Users.worldwide = 1
                                UNION
                                SELECT UserBooks.id AS id, listingDate, description, title AS title, author AS author, imgUrl AS imgUrl, isbn13 AS isbn, Users.country
                                FROM UserBooks
                                INNER JOIN Conditions ON Conditions.id = UserBooks.conditionId
                                INNER JOIN Books ON Books.id = UserBooks.bookId
                                INNER JOIN Users ON Users.id = UserBooks.userId
                                WHERE UserBooks.userId != 1 AND UserBooks.available = 1 AND Users.country = 1
                                ORDER BY isbn ASC`;

    var selectUserCountry = `SELECT Users.country AS country, Users.points AS userPoints
                            FROM Users
                            WHERE Users.id = ?`
    const userId = id;
    var payload = { 
        title: 'Available Books',
        books: [],
    };
    
    db.pool.query(selectUserCountry, [userId], (err,result) =>{
        if(err){
            next(err);
            return
        }
        var country = result[0].country;
        var userPoints = result[0].userPoints;
        
        db.pool.query(selectAllAvailableBooks, [userId, userId, country], (err, result) => {
            if (err) {
                // update error handling
                next(err);
                return;
            }
            var number = result.length;
            // ********* need to update the point value
            var points; 
            var copy;
            var count = 0;
            for (let i = 0; i < number; i++) {
                points = 2;
                if(country != result[i].country){
                    points = 4;
                }
                var data = {
                    id: [result[i].id],
                    title: result[i].title,
                    author: result[i].author,
                    imgUrl: result[i].imgUrl,
                    pointcost: points,
                    isbn: result[i].isbn,
                    userPoints: userPoints,
                    condition: [result[i].description],
                    date: [result[i].listingDate],
                    genre: result[i].genre,
                    rating: result[i].rating,
                    pubDate: result[i].pubDate,
                    copies: 0
                }
                if (i != 0 && copy.isbn == data.isbn){
                    if (count == 0){
                        copy.copies++;
                    }
                    copy.id.push(result[i].id);
                    copy.condition.push(result[i].description);
                    copy.date.push(result[i].listingDate);
                    copy.copies++;
                    count++;
                    continue;
                }
                payload.books.push(new Book(data));   
                copy = payload.books[payload.books.length-1];  
                count = 0;      
            }   
            return callback(payload);
        })
    })
}


// @route   POST /home
// @desc    Request a book
router.post('/request', common.isAuthenticated, (req, res, next) => {
    const errMsg = 'Error requesting book, please try again.'
    var id = req.body.bookId
    var title = req.body.title
    var userId = req.session.userId
    var pointCost = req.body.pointCost
    var date = new Date()
    
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
            db.pool.query('INSERT INTO Transactions (userBookId, requestorId, statusId, sellerPoints, buyerPoints, created, modified) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, userId, 1, pointCost, pointCost * -1, date, date], (err,result) => {
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
                        var successMsg = req.body.title + ' has been requested!';
                        // database has been updated
                        // send an email to the seller that a book has been requested
                        // **** update text or maybe use html
                        var message = {
                            to: req.session.email,
                            subject: 'Book Request',
                            text: 'You have a new request for ' + title
                        }
                        common.transport.sendMail(message);
                        req.flash('success', successMsg)
                        res.send({success: 'success'});
                    });
                }
            });
        }
    });
});


module.exports = router;
