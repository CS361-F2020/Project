const express = require('express');
// const { timers } = require('jquery');
const router = express.Router();
const db = require('../dbcon.js');

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
// @access  Private
router.get('/', (req, res, next) => {
    const userId = req.session.userId;
    var payload = {};
    var library = [];
    db.pool.query(selectAllBooks, [userId], (err, result) => {
        if (err) {
            next(err);
            return;
        }
        for (let i = 0; i < result.length; i++) {
            library.push(new Book(result[i].userBookId, result[i].bookId, result[i].swap, result[i].title, result[i].imgUrl));
        }
        payload.library = library;
        res.render('mylibrary', payload);
    })
});

// Route for removing a book from a user library
router.delete('/', (req, res, next) => {
    var { userBookId } = req.body;
    db.pool.query(deleteUserBook, [userBookId], (err, result) => {
        if (err) {
            next(err);
            return;
        }
        res.json({ 'delete': true });
    });
});

module.exports = router;