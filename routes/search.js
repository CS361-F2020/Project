const express = require('express');
const router = express.Router();
const db = require('../dbcon.js');

// Book object
function Book(title, author, imgUrl, pointcost) {
    this.title = title;
    this.author = author;
    this.imgUrl = imgUrl;
    this.pointcost = pointcost
}


                                 
// @route   GET /allBooks
// @desc    Get all available books that don't belong to the user and are not undergoing transactions
router.get('/', (req, res, next) => {
    var selectAllAvailableBooks = `SELECT title AS title, author AS author, imgUrl AS imgUrl
                                 FROM UserBooks
                                 INNER JOIN Books ON Books.id = UserBooks.bookId
                                 WHERE UserBooks.userId != ? AND UserBooks.available = 1`;
    const userId = req.session.userId;
    var payload = {};
    var books = [];
    

    db.pool.query(selectAllAvailableBooks, [userId], (err, result) => {
        if (err) {
            
            next(err);
            return;
        }
        var number = result.length;

        //entering 5 as the point cost for now.
        //I think we discussed in a meeting to keep the point cost constant for all books in the beginning.
        for (let i = 0; i < number; i++) {
            books.push(new Book(result[i].title, result[i].author, result[i].imgUrl, 5));

            
        }
        payload.books = books;
        payload.number = number;
        console.log(payload);
        res.render('allbooks', payload);
    })
});

module.exports = router;
