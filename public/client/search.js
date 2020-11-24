// request button- activate modal
function requestBook(bookId, pointCost, title, userPoints){
    if(pointCost > userPoints){
        $("#pointsModal").modal("show");
    }
    else{
        var confirmButton = confirm("Are you sure you want " + title + "?");
        if(confirmButton){
            request(bookId, pointCost, title);
        }
    }
}

// AJAX request a book
function request(bookId, pointCost, title){
    $.ajax({
        url: '/search',
        method: 'POST',
        dataType: 'json',
        data: {'bookId': bookId, 'title': title, 'pointCost': pointCost},
        success: function (res) {
            // remove the card 
            var card = document.getElementById(bookId);
            card.parentNode.removeChild(card);
            // hide the modal
            $('#pageModal').modal('hide');
            location.reload();
        },
        error: function (jqXHR, textstatus, errorThrown) {
            console.log(textstatus)
            alert('Error occured while retrieving book')
        }
    })
}

function bookDetails(isbn, pointCost){
        $.ajax({
            url: '/googleapi/isbn/' + isbn,
            method: 'GET',
            dataType: 'json',
            success: function (res) {
                $("#detailTitle").text(res.title)
                $("#detailAuthor").text(res.author)
                $("#detailGenre").text(res.genre)
                $("#detailLanguage").text(res.language)
                $("#detailPointCost").text(pointCost)
                $("#detailRating").text(res.rating)
                $("#detailDescription").text(res.description)
                $("#detailModal").modal("show");
            },
            error: function (jqXHR, textstatus, errorThrown) {
                console.log(textstatus)
                alert('Error occured while retrieving book')
            }
        })  
}

function searchResults() {
    var input, filter, cards, cardContainer, title, i;
    input = document.getElementById("myFilter");
    filter = input.value.toUpperCase();
    cardContainer = document.getElementById("myItems");
    cards = cardContainer.getElementsByClassName("card");
    
    for (i = 0; i < cards.length; i++) {
        genre = cards[i].querySelector(".card-body div.card-genre");
        author = cards[i].querySelector(".card-body p.card-author");
        title = cards[i].querySelector(".card-body p.card-title");
        rating = cards[i].querySelector(".card-body div.card-rating");
        pubDate = cards[i].querySelector(".card-body div.card-pubdate");

        if ((genre.innerText.toUpperCase().indexOf(filter)   > -1) ||
            (author.innerText.toUpperCase().indexOf(filter)  > -1) ||
            (title.innerText.toUpperCase().indexOf(filter)   > -1) ||
            (rating.innerText.toUpperCase().indexOf(filter)  > -1) ||
            (pubDate.innerText.toUpperCase().indexOf(filter) > -1)) 
        {
            cards[i].style.display = "";
        } else {
            cards[i].style.display = "none";
        }
    }
}
