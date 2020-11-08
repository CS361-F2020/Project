const express = require('express');
const router = express.Router();
const books = require('google-books-search');

app.get('/isbn/(:isbn)', function(req, res, next){
    var options = { field: 'isbn', type: 'books', order: 'newest' }
    books.search(req.params.isbn, options, function(err, results, resp){
        if (err) {
            console.log(err)
        }
        else {
            var response = resp.items[0].volumeInfo
            var book = {
                title: response.title,
                author: response.authors ? response.authors[0] : "",
                genre: response.categories ? response.categories[0] : "",
                language: response.language,
<<<<<<< HEAD
                isbn13: response.industryIdentifiers[0].identifier,
                isbn10: response.industryIdentifiers[1].identifier,
                imgUrl: response.imageLinks.thumbnail,
=======
                isbn10: response.industryIdentifiers[0].identifier,
                isbn13: response.industryIdentifiers[1].identifier,
                imgUrl: response.thumbnail,
>>>>>>> origin/melissa
                rating: response.averageRating,
                pubDate: response.publishedDate,
                pageCount: response.pageCount
            }
            res.send(book);
        }
    })
})

module.exports = router;