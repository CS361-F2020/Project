const express = require('express');
// const { timers } = require('jquery');
const router = express.Router();
const db = require('../dbcon.js');

// Book object
function Book(id, swap, title, imgUrl) {
    this.id = id;
    this.swap = swap
    this.title = title;
    this.imgUrl = imgUrl;
}

// Queries
const selectAllBooks = `SELECT Books.id AS id, available AS swap, listingDate AS date, Books.title AS title, Books.imgUrl AS imgUrl
                        FROM UserBooks
                        INNER JOIN Books ON Books.id = UserBooks.bookId
                        WHERE UserBooks.userId = ?`;

// @route   GET /mylibrary
// @desc    Get current users mylibrary
// @access  Private
router.get('/', (req, res, next) => {
    // still needs user auth/id either as a :param or token
    const userId = 1; // for testing
    var payload = {};
    var library = [];
    db.pool.query(selectAllBooks, [userId], (err, result) => {
        if (err) {
            next(err);
            return;
        }
        for (let i = 0; i < result.length; i++) {
            library.push(new Book(result[i].id, result[i].swap, result[i].title, result[i].imgUrl));
        }
        payload.library = library;
        // console.log(payload.library);
        res.render('mylibrary', payload);
    })
});

// Route for adding a book
router.post('/', (req, res, next) => {
    var book = {};
    res.send(book);
});

module.exports = router;