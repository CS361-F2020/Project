// const { delete } = require("../../routes/mylibrary");

const url = 'http://flip1.engr.oregonstate.edu:8081/mylibrary';
// remove a book from user mylibrary
function remove(userBookId) {
    var data = { 'userBookId': userBookId };
    var req = new XMLHttpRequest();
    req.open("DELETE", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(data));
    req.addEventListener('load', () => {
        // remove the book by bookid from the page
        if (JSON.parse(req.response).delete == true) {
            var book = document.getElementById(userBookId);
            book.parentNode.removeChild(book);
        }
    });
}