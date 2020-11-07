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

// Queries
const selectAllBooks = `SELECT UserBooks.id AS userBookId, Books.id AS bookId, available AS swap, listingDate AS date, Books.title AS title, Books.imgUrl AS imgUrl
                        FROM UserBooks
                        INNER JOIN Books ON Books.id = UserBooks.bookId
                        WHERE UserBooks.userId = ?`;
const deleteUserBook = 'DELETE FROM UserBooks WHERE id = ?';

// @route   GET /mylibrary
// @desc    Get current users mylibrary
router.get('/', common.isAuthenticated, (req, res, next) => {
    const userId = req.session.userId;
    var payload = {};
    var library = [];
    var avail = 0;
    var rcvd = 0;
    sql.pool.query(selectAllBooks, [userId], (err, result) => {
        if (err) {
            // fix error handeling with flash response?
            next(err);
            return;
        }
        for (let i = 0; i < result.length; i++) {
            library.push(new Book(result[i].userBookId, result[i].bookId, result[i].swap, result[i].title, result[i].imgUrl));
            if (result[i].swap == 0) {
                rcvd++;
            } else {
                avail++;
            }
        }
        payload.library = library;
        payload.avail = avail;
        payload.rcvd = rcvd;
        payload.title = 'My Library'
        res.render('mylibrary', payload);
    })
});

// @route   DELETE /mylibrary
// @desc    Removing a book from a user library
router.delete('/', (req, res, next) => {
    var { userBookId } = req.body;
    sql.pool.query(deleteUserBook, [userBookId], (err, result) => {
        if (err) {
            // fix error handeling with flash response?
            next(err);
            return;
        }
        res.json({ 'delete': true });
    });
});

router.post('/add', (req, res, next) => {
    var formData = req.body
    console.log(formData)
    var isbn = formData.isbn13
    var defaultErrorMessage = 'Error in adding book. Please try again later.'

    var userBook = {
        userId: req.session.userId,
        bookId: 0,
        conditionId: null,
        listingDate: new Date(),
        available: true
    }
    console.log(isbn)
    sql.pool.query('SELECT * FROM Books WHERE isbn10 = ? OR isbn13 = ?', [isbn, isbn],
    function(err, rows){
        console.log(rows)
        if (err){
            console.log(err)
            res.send({ error: defaultErrorMessage })
        } else if (rows.length == 0) {
            sql.pool.query('INSERT INTO Books SET ?', [formData],
            function(err, result){
                if (err) {
                    console.log(err)
                    res.send({ error: defaultErrorMessage })
                }
                else {
                    console.log(result.insertId)
                    userBook.bookId = result.insertId
                    sql.pool.query('INSERT INTO UserBooks SET ?', [userBook],
                    function(err, rows){
                        if (err) {
                            console.log(err)
                            res.send({ error: defaultErrorMessage })
                        }
                        else {
                            res.send()
                        }
                    })
                }
            })
        } else {
            sql.pool.query('SELECT id FROM Books WHERE isbn10 = ? OR isbn13 = ?', [isbn, isbn],
            function(err, rows){
                if (err) {
                    console.log(err)
                    res.send({ error: defaultErrorMessage })
                }
                else {
                    console.log(rows[0].id)
                    userBook.bookId = rows[0].id
                    sql.pool.query('INSERT INTO UserBooks SET ?', [userBook],
                    function(err, rows){
                        if (err) {
                            console.log(err)
                            res.send({ error: defaultErrorMessage })
                        }
                        else {
                            req.flash('success', req.body.title + ' has been added to your library!')
                            res.send({ success: req.body.title + ' has been added to your library!', redirect: '/mylibrary' })
                        }
                    })
                }
            })
        }
    })
})

module.exports = router;