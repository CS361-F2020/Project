const express = require('express')
const router = express.Router()
const sql = require('../dbcon.js')
const common = require('../common')

// Book object
function Book(userBookId, bookId, swap, title, imgUrl) {
    this.userBookId = userBookId;
    this.bookId = bookId;
    this.swap = swap
    this.title = title;
    this.imgUrl = imgUrl;
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

router.post('/add', (req, res, next) => {
    var formData = {
        title: req.body.title,
        author: req.body.author,
        genre: req.body.genre,
        language: req.body.language,
        imgUrl: req.body.imgUrl,
        rating: req.body.rating,
        pubDate: req.body.pubDate,
        pageCount: req.body.pageCount,
        isbn10: req.body.isbn10,
        isbn13: req.body.isbn13
    }
    var isbn = formData.isbn13
    var defaultErrorMessage = 'Error in adding book. Please try again later.'

    var userBook = {
        userId: req.session.userId,
        bookId: 0,
        conditionId: req.body.conditionId,
        listingDate: new Date(),
        available: true
    }

    // Check if book already exists
    sql.pool.query('SELECT * FROM Books WHERE isbn10 = ? OR isbn13 = ?', [isbn, isbn],
        function (err, rows) {
            if (err) {
                console.log(err)
                res.send({ error: defaultErrorMessage })
            }
            else if (rows.length == 0) {
                // if does not exist, insert book
                sql.pool.query('INSERT INTO Books SET ?', [formData],
                    function (err, result) {
                        if (err) {
                            console.log(err)
                            res.send({ error: defaultErrorMessage })
                        }
                        else {
                            // insert record into user book using insert id
                            userBook.bookId = result.insertId
                            sql.pool.query('INSERT INTO UserBooks SET ?', [userBook],
                                function (err, rows) {
                                    if (err) {
                                        console.log(err)
                                        res.send({ error: defaultErrorMessage })
                                    }
                                    else {
                                        //add points for adding book 
                                        sql.pool.query('UPDATE Users SET points = points + 1 WHERE id = ?', [req.session.userId],
                                            function (err, rows) {
                                                if (err) {
                                                    console.log(err)
                                                    res.send({ error: defaultErrorMessage })
                                                }
                                                // send success message after insert
                                                req.flash('success', req.body.title + ' has been added to your library!')
                                                res.send({ success: 'success' })
                                            })
                                    }
                                })
                        }
                    })
            } else {
                // if exists, get book id from table
                sql.pool.query('SELECT id FROM Books WHERE isbn10 = ? OR isbn13 = ?', [isbn, isbn],
                    function (err, rows) {
                        if (err) {
                            console.log(err)
                            res.send({ error: defaultErrorMessage })
                        }
                        else {
                            // insert record for user books using existing book id
                            userBook.bookId = rows[0].id
                            sql.pool.query('INSERT INTO UserBooks SET ?', [userBook],
                                function (err, rows) {
                                    if (err) {
                                        console.log(err)
                                        res.send({ error: defaultErrorMessage })
                                    }
                                    else {
                                        //add points for adding book 
                                        sql.pool.query('UPDATE Users SET points = points + 1 WHERE id = ?', [req.session.userId],
                                            function (err, rows) {
                                                if (err) {
                                                    console.log(err)
                                                    res.send({ error: defaultErrorMessage })
                                                }
                                                // send success message after insert
                                                req.flash('success', req.body.title + ' has been added to your library!')
                                                res.send({ success: 'success' })
                                            })

                                    }
                                })
                        }
                    })
            }
        })
})

module.exports = router;