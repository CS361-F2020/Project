const express = require('express');
const router = express.Router();
const axios = require("axios")
const jquery = require("jquery")
const db = require('../dbcon.js');

// Book object
function Book(bookId, title, author, genre, isbn, imgUrl) {
    
    this.bookId = bookId;
    this.title = title;
    this.author = author;
    this.genre = genre;
    this.isbn = isbn;
    this.imgUrl = imgUrl;
}

// Queries

const selectAllAvailableBooks = `SELECT Books.id AS bookId, title AS title, author AS author, genre AS genre, isbn AS isbn, imgUrl AS imgUrl
                                 FROM UserBooks
                                 LEFT JOIN Books ON Books.id = UserBooks.bookId
                                 LEFT JOIN Transactions ON Transactions.userBookId = UserBooks.id
                                 WHERE NOT UserBooks.userId = ?
                                 AND Transactions.userBookId IS NULL`;
                                 

// @route   GET /allBooks
// @desc    Get all available books that don't belong to the user and are not undergoing transactions
router.get('/', (req, res, next) => {
    const userId = req.session.userId;
    var payload = {};
    var books = [];
    
    db.pool.query(selectAllAvailableBooks, [userId], (err, result) => {
        if (err) {
            
            next(err);
            return;
        }
        for (let i = 0; i < result.length; i++) {
            books.push(new Book(result[i].bookId, result[i].title, result[i].author, result[i].genre, result[i].isbn, result[i].imgUrl));
            
        }
        payload.books = books;
        
        res.render('allbooks', payload);
    })
});

module.exports = router;
