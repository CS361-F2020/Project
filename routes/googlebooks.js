const express = require('express');
const router = express.Router();
const axios = require("axios")
const jquery = require("jquery")
const db = require('../dbcon.js');
//google books api call


router.get('/searchByISBN/:id', (req, res, next) => {
    
    let bookData = getBookData(req,res, (err,data) => {
        if(err) {
            console.log(err)
        }
        else{
            console.log('Returning Book Data')
            res.send(data);
            
        }
    })
    console.log('Doing more work')
    
})


function getBookData(req, res, callback){
    const search = req.params.id;
    console.log(search);
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${search}`
    
    //tried using ajax got the following
    //reference error $ not defined

    /*
    $.ajax(
        {
            url: `https://www.googleapis.com/books/v1/volumes?q=${search}`,
            dataType: "json",
            success: function(data){
                console.log(response.data.items[0].volumeInfo);
                var book = { };

                book.title = response.data.items[0].volumeInfo.title;
                book.author = response.data.items[0].volumeInfo.authors[0];
                book.genre = response.data.items[0].volumeInfo.categories[0];
                book.language = response.data.items[0].volumeInfo.language;
                book.isbn_13 = response.data.items[0].volumeInfo.industryIdentifiers[0].identifier;
                book.isbn_10 = response.data.items[0].volumeInfo.industryIdentifiers[1].identifier;
                book.imgUrl = response.data.items[0].volumeInfo.imageLinks.thumbnail;
                console.log(book);
                callback(null, book);
            },
            error: function(xhr, textStatus, error){
                console.log(xhr.statusText);
                console.log(textStatus);
                console.log(error);
                callback(error, null);
            },
            type: 'GET'
        }
    );
    */
    
    axios.get(url).then((response) => {
        console.log(response.data.items[0].volumeInfo);
        
        var book = {
            
        };

        book.title = response.data.items[0].volumeInfo.title;
        book.author = response.data.items[0].volumeInfo.authors[0];
        book.genre = response.data.items[0].volumeInfo.categories[0];
        book.language = response.data.items[0].volumeInfo.language;
        book.isbn_13 = response.data.items[0].volumeInfo.industryIdentifiers[0].identifier;
        book.isbn_10 = response.data.items[0].volumeInfo.industryIdentifiers[1].identifier;
        book.imgUrl = response.data.items[0].volumeInfo.imageLinks.thumbnail;
        console.log(book);
        callback(null, book);
    }).catch((error) => {
        callback(error, null)
})}
 

module.exports = router;