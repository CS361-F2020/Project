const express = require('express')
const router = express.Router()
const books = require('google-books-search')

router.get('/isbn/(:isbn)', (req, res, next) =>{
    var options = { field: 'isbn', type: 'books', order: 'newest' }
    books.search(req.params.isbn, options, function(err, resp){
        if (err) {
            console.log(err)
            res.send({ error: 'Error in finding book by ISBN. Please try again.'}) 
        }
        else if (resp.length > 0) {
            var response = resp[0]
            var book = {
                title: response.title,
                author: response.authors? response.authors[0] : "",
                genre: response.categories ? response.categories[0] : "",
                language: response.language,
                isbn13: response.industryIdentifiers[1].identifier,
                isbn10: response.industryIdentifiers[0].identifier,
                imgUrl: response.thumbnail,
                rating: response.averageRating,
                publisher: response.publisher,
                pubDate: response.publishedDate,
                pageCount: response.pageCount,
                description: response.description,
                googleLink: response.link
            }
            res.send(book)
        }
        else {
            res.send({ message: 'No book found with isbn: ' + req.params.isbn})
        }
    })
})

module.exports = router;