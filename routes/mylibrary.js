const express = require('express');
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
router.get('/', (req, res, next) => {
    const userId = req.session.userId;
    var payload = {};
    var library = [];
    var avail = 0;
    var rcvd = 0;
    db.pool.query(selectAllBooks, [userId], (err, result) => {
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
    db.pool.query(deleteUserBook, [userBookId], (err, result) => {
        if (err) {
            // fix error handeling with flash response?
            next(err);
            return;
        }
        res.json({ 'delete': true });
    });
});

app.post('/add', function (req, res, next) {
    
    console.log('adding book to books table:');
    
    //see if the book already exists in our table based on isbn10
    sql.pool.query('SELECT * FROM Books WHERE isbn10=?', [data.isbn10],
    function (err, results) {
        if (err) {
            req.flash('error', err)
            res.render('auth/errors/500', data)
        } else if (results.length > 0) {
            //if it already exists then enter into user books
            console.log("Book already exits in Books table. Adding association to UserBooks");

            var queryStr = 
                "INSERT INTO UserBooks" +
                " (`userId`,`bookId`,`conditionId`,`listingDate`,`available`)" +
                " VALUES (?)";

            var date = new Date().toISOString().slice(0, 19).replace('T', ' ');

            values = [[req.session.userId, results.id, 5, date, 1]];

            sql.pool.query(queryStr, values, function(err, result){

                if(err){
                    if (err.code == 'ER_DUP_ENTRY') {
                    console.log('DONE: Userbooks entry already exists');
                    
                    }
                    else {
                        console.log(err.code);
                        console.log("ERROR INSERT !!!!");
                        console.log(err);
                        return;
                    }
                }
                else {
                    console.log('entry successfully inserted into UserBooks');
                
                }
            })
        } else if(results.length == 0) {
        //if the book doesnt exist in the books table then add it into books and userbooks
            var values = [[req.body.title, req.body.author, req.body.genre, req.body.language, req.body.isbn13, req.body.isbn10, req.body.imgUrl, req.body.rating, req.body.pubDate, req.body.pageCount]];

            var queryStr = 
            "INSERT INTO Books" +
            " (`title`,`author`,`genre`,`language`,`isbn13`, `isbn10`, `imgUrl`, `rating`, `pubDate`, `pageCount`)" +
            " VALUES (?)";
    
            //show values that will be entered into query
            console.log(queryStr);
            console.log("values:");
            console.log(values);

            sql.pool.query(queryStr, values, function(err, result){

                if(err){
                    if (err.code == 'ER_DUP_ENTRY') {
                        console.log('DONE: book already exists in table');
        
                    }
                    else {
                        console.log(err.code);
                        console.log("ERROR INSERT !!!!");
                        console.log(err);
                        return;
                    }
                }
                else {
                    console.log('book successfully inserted into Books');
                    console.log("Adding association to UserBooks");

                    var queryStr = 
                        "INSERT INTO UserBooks" +
                        " (`userId`,`bookId`,`conditionId`,`listingDate`,`available`)" +
                        " VALUES (?)";

                    var date = new Date().toISOString().slice(0, 19).replace('T', ' ');

                    values = [[req.session.userId, result.insertId, 5, date, 1]];

                    sql.pool.query(queryStr, values, function(err, result){

                        if(err){
                            if (err.code == 'ER_DUP_ENTRY') {
                                console.log('DONE: Userbooks entry already exists');
                    
                            }
                            else {
                                console.log(err.code);
                                console.log("ERROR INSERT !!!!");
                                console.log(err);
                                return;
                            }
                        }
                        else {
                            console.log('entry successfully inserted into UserBooks');
                
                        }
                    })
        
                }
            })
        } 
                   
    })
})

module.exports = router;