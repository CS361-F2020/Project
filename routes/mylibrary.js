const express = require('express')
const router = express.Router()
const sql = require('../dbcon.js')
const common = require('../common')

// global variables
var today = new Date()

// Book object
function Book(data) {
    this.userBookId = data.userBookId;
    this.swap = data.swap
    this.title = data.title;
    this.author = data.author;
    this.imgUrl = data.imgUrl;
    this.condition = data.condition;
    this.date = data.date;
    this.copies = data.copies;
}

// Full Book Object
function BookFull(data)
{
    this.title = data.title,
    this.author = data.author,
    this.genre =  data.genre,
    this.language = data.language,
    this.imgUrl = data.imgUrl,
    this.rating = data.rating,
    this.pubDate = data.pubDate,
    this.pageCount = data.pageCount,
    this.isbn10 = data.isbn10,
    this.isbn13 = data.isbn13
}

// Adds a new book to the user's library (only use if bookExists returns false)
function addNewBookToLibrary(book, conditionId, userId, callback)
{
    var query = 'INSERT INTO Books SET ?'
    sql.pool.query(query, [book], (err, result) => {
        if (err) {
            return callback(err, false)
        }

        addUserBook(userId, result.insertId, conditionId, (err) => {
            if (err) {
                return callback(err, false)
            }

            common.updateUserPoints(userId, 1, (err) => {
                if (err) {
                    return callback(err, false)
                }

                return callback('', true)
            })
        })
    })
}

// Add existing book to user's library (must have an existing book id to use this!)
function addExistingBookToLibrary(bookId, conditionId, userId, callback)
{
    addUserBook(userId, bookId, conditionId, (err) => {
        if (err) {
            return callback(err, false)
        }

        common.updateUserPoints(userId, 1, (err) => {
            if (err) {
                return callback(err, false)
            }

            return callback('', true)
        })
    })
}

// Add record to UserBooks table
function addUserBook(userId, bookId, conditionId, callback)
{
    var userBook = { 
        userId: userId, 
        bookId: bookId , 
        conditionId: conditionId,
        listingDate: today,
        available: true
    }

    var query = 'INSERT INTO UserBooks SET ?'
    sql.pool.query(query, [userBook], (err) => {
        if (err) {
            return callback(err, false)
        }
        return callback('', true)
    })
}

// @route   GET /mylibrary
// @desc    Get current users mylibrary
router.get('/', common.isAuthenticated, (req, res, next) => {
    const userId = req.session.userId;
    var payload = { 
        title: 'My Library', 
        library: [],
        avail: 0,
        rcvd: 0
    };
    var selectAllBooks = `SELECT UserBooks.id AS userBookId, available AS swap, listingDate AS date, description, Books.author As author, Books.title AS title, Books.imgUrl AS imgUrl
                        FROM UserBooks
                        INNER JOIN Books ON Books.id = UserBooks.bookId
                        INNER JOIN Conditions on Conditions.id = UserBooks.conditionId
                        WHERE UserBooks.userId = ? AND UserBooks.available = 1
                        ORDER BY title ASC`;
    var selectRCVDBooks = `SELECT UserBooks.id AS userBookId, date, description, available AS swap, Books.author As author, Books.title AS title, Books.imgUrl AS imgUrl
                        FROM Books
                        INNER JOIN UserBooks ON UserBooks.bookId = Books.id
                        INNER JOIN Transactions ON Transactions.userBookId = UserBooks.id 
                        INNER JOIN TransactionStatusDates ON TransactionStatusDates.transactionId = Transactions.id
                        INNER JOIN Conditions on Conditions.id = UserBooks.conditionId
                        WHERE Transactions.requestorId = ? AND Transactions.statusId = 8 AND TransactionStatusDates.statusId = 4`;
    sql.pool.query(selectAllBooks, [userId], (err, result) => {
        if (err) {
            req.flash('error', 'Error retrieving all books. Try refreshing your page.')
            res.render('myLibrary')
        }
        var copy;
        var count = 0;
        for (let i = 0; i < result.length; i++) {
            var data = {
                userBookId: [result[i].userBookId],
                swap: result[i].swap,
                title: result[i].title,
                author: result[i].author,
                imgUrl: result[i].imgUrl,
                condition: [result[i].description],
                date: [result[i].date],
                copies: 0
            }
            if (result[i].swap == 1) {
                payload.avail++;
            }
            if (i != 0 && copy.title == data.title){
                if (count == 0){
                    copy.copies++;
                }
                copy.userBookId.push(result[i].userBookId);
                copy.condition.push(result[i].description);
                copy.date.push(result[i].date);
                copy.copies++;
                count++;
                continue;
            }
            payload.library.push(new Book(data));
            copy = payload.library[payload.library.length-1];
        }
        // all books rcvd in swaps
        sql.pool.query(selectRCVDBooks, [userId], (err, result) => {
            if (err) {
                req.flash('error', 'Error retrieving all books. Try refreshing your page.')
                res.render('myLibrary')
            }
            var copy;
            var count = 0;
            for (let i = 0; i < result.length; i++) {
                var data = {
                    userBookId: [result[i].userBookId],
                    swap: result[i].swap,
                    title: result[i].title,
                    author: result[i].author,
                    imgUrl: result[i].imgUrl,
                    condition: [result[i].description],
                    date: [result[i].date],
                    copies: 0
                }
                if (result[i].swap == 0) {
                    payload.rcvd++;
                }
                if (i != 0 && copy.title == data.title){
                    if (count == 0){
                        copy.copies++;
                    }
                    copy.userBookId.push(result[i].userBookId);
                    copy.condition.push(result[i].description);
                    copy.date.push(result[i].date);
                    copy.copies++;
                    count++;
                    continue;
                }
                payload.library.push(new Book(data));   
                copy = payload.library[payload.library.length-1];  
                count = 0;      
            } 
            res.render('mylibrary', payload);
        });
    })
});

// @route   DELETE /mylibrary
// @desc    Removing a book from a user library
router.delete('/', (req, res, next) => {
    var { userBookId } = req.body;
    var deleteUserBook = 'DELETE FROM UserBooks WHERE id = ?'
    sql.pool.query(deleteUserBook, [userBookId], (err, result) => {
        if (err) {
            console.log(err)
            res.send({ error: 'Error removing your book. Try refreshing your page.' })
        } else if (result) {
            req.flash('success', 'A book has been removed from your library!')
            res.send({ success: 'success' })
        }
    })
});

router.post('/add', (req, res) => {
    var errorMsg = 'Error while trying to add book. Please try again or contact support at bookswaphelpdesk@gmail.com'
    var successMsg = req.body.title + ' has been added to your library!'

    common.bookExists(req.body.isbn13, (err, exists, bookId) => {
        if (err)
        {
            console.log(err)
            return res.send({ error: errorMsg})
        }
        else if (exists == false)
        {
            var bookDetails = new BookFull(req.body)
            addNewBookToLibrary(bookDetails, req.body.conditionId, req.session.userId, (err, success) => {
                if (success == false) {
                    console.log(err)
                    return res.send({ error: err })
                }
                req.flash('success', successMsg)
                return res.send({ success: 'success' })
            })
        }
        else 
        {
            addExistingBookToLibrary(bookId, req.body.conditionId, req.session.userId, (err, success) => {
                if (success == false)
                {
                    console.log(err)
                    return res.send({ error: err })
                }
                req.flash('success', successMsg)
                return res.send({ success: 'success'})
            })
        }
    })
})

module.exports = router;