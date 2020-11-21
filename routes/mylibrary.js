const express = require('express')
const router = express.Router()
const sql = require('../dbcon.js')
const common = require('../common')

// global variables
var today = new Date()

// Book object
function Book(userBookId, bookId, swap, title, imgUrl) {
    this.userBookId = userBookId;
    this.bookId = bookId;
    this.swap = swap
    this.title = title;
    this.imgUrl = imgUrl;
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
        titles: [],
        conditions: [],
        avail: 0,
        rcvd: 0
    };
    var selectAllBooks = `SELECT UserBooks.id AS userBookId, Books.id AS bookId, available AS swap, listingDate AS date, Books.title AS title, Books.imgUrl AS imgUrl
                        FROM UserBooks
                        INNER JOIN Books ON Books.id = UserBooks.bookId
                        WHERE UserBooks.userId = ?`
    var selectAllConditions = 'SELECT id, description FROM Conditions ORDER BY id'
    var selectAllTitles = 'SELECT isbn13, title FROM Books ORDER BY title'
    sql.pool.query(selectAllBooks, [userId], (err, result) => {
        if (err) {
            req.flash('error', 'Error retrieving all books. Try refreshing your page.')
            res.render('myLibrary')
        }
        for (let i = 0; i < result.length; i++) {
            payload.library.push(new Book(result[i].userBookId, result[i].bookId, result[i].swap, result[i].title, result[i].imgUrl));
            if (result[i].swap == 0) {
                payload.rcvd++;
            } else {
                payload.avail++;
            }
        }
        sql.pool.query(selectAllTitles, [], (err, result) => {
            if (err) {
                req.flash('error', 'Error retrieving book by title.')
                res.render('myLibrary', payload)
            }
            for (let i = 0; i < result.length; i++) {
                payload.titles.push({ id: result[i].isbn13, label: result[i].title });
            }
            sql.pool.query(selectAllConditions, [], (err, result) => {
                if (err) {
                    req.flash('error', 'Error retrieving book by condition.')
                    res.render('myLibrary', payload)
                }
                for (let i = 0; i < result.length; i++) {
                    payload.conditions.push({ id: result[i].id, label: result[i].description });
                }
                res.render('mylibrary', payload);
            })
        })
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