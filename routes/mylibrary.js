const express = require('express');
const { timers } = require('jquery');
const router = express.Router();
const db = require('../dbcon.js');

// reusable books class
function Book(id, title, author, genre, language, isbn, imgUrl) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.genre = genre;
    this.language = language;
    this.isbn = isbn;
    this.imgUrl = imgUrl;
}

// Queries
// need to mod this query to also include data added
const selectAllBooks = 'SELECT * FROM Books WHERE Id = ANY(SELECT bookId FROM UserBooks WHERE userId = ?)';

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
            library.push(new Book(result[i].id, result[i].title, result[i].author, result[i].genre, result[i].language, result[i].isbn, result[i].imgUrl));
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