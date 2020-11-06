const express = require('express');
const router = express.Router();
const books = require('google-books-search');

router.get('/isbn/(:isbn)', function(req, res, next){
    var options = { field: 'isbn', type: 'books', order: 'newest' }
    books.search(req.params.isbn, options, function(err, results, resp){
        if (err) {
            console.log(err)
        }
        else {
            var response = resp.items[0].volumeInfo
            var book = {
                title: response.title,
                author: response.authors[0],
                genre: response.categories[0],
                language: response.language,
                isbn13: response.industryIdentifiers[0].identifier,
                isbn10: response.industryIdentifiers[1].identifier,
                imgUrl: response.imageLinks.thumbnail,
                rating: response.averageRating,
                pubDate: response.publishedDate,
                pageCount: response.pageCount
            }
            res.send(book);
        }
    })
})

module.exports = router;