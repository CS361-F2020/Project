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

const selectAllAvailableBooks = `SELECT Books.id AS bookId, title AS title, author AS author, genre AS genre, isbn13 AS isbn, imgUrl AS imgUrl
                                 FROM UserBooks
                                 INNER JOIN Books ON Books.id = UserBooks.bookId
                                 WHERE UserBooks.userId != ? AND UserBooks.available = 1`;
                                 

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
        var number = result.length;
        
        for (let i = 0; i < number; i++) {
            books.push(new Book(result[i].bookId, result[i].title, result[i].author, result[i].genre, result[i].isbn, result[i].imgUrl));
            
        }
        payload.books = books;
        payload.number = number;
        console.log(payload);
        res.render('allbooks', payload);
    })
});

module.exports = router;
