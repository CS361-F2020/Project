// request button- activate modal
function requestBook(bookId, pointCost, title, userPoints){
    var modalBody = document.getElementById('modalBody');
    if(pointCost > userPoints){
        
        $("#pointsModal").modal("show");
    }
    else{
        
        $("#requestTitle").text(title)
        var confirmButton = document.getElementById('confirmButton');
        //title was previously surrounded in single quotes
        confirmButton.setAttribute("onclick", `request(${bookId}, ${pointCost}, "${title}")`);
        // toogle modal
        $("#pageModal").modal("toggle");
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
            // might be better to use flash instead of this so that users get a notification on screen
            var card = document.getElementById(bookId);
            card.parentNode.removeChild(card);
            // hide the modal
            $('#pageModal').modal('hide');
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
    var input, filter, cards, cardContainer, p, title, i;
    input = document.getElementById("myFilter");
    filter = input.value.toUpperCase();
    cardContainer = document.getElementById("myItems");
    cards = cardContainer.getElementsByClassName("card");
  
    genreText = ".card-body p.card-genre";

    authorText = ".card-body p.card-author";

    titleText = ".card-body p.card-title";
    
    ratingText = ".card-body p.card-rating";

    pubDateText = ".card-body p.card-pubdate";
           
    
    for (i = 0; i < cards.length; i++) {
        genre = cards[i].querySelector(genreText);
        author = cards[i].querySelector(authorText);
        title = cards[i].querySelector(titleText);
        rating = cards[i].querySelector(ratingText);
        pubDate = cards[i].querySelector(pubDateText);
        if ((genre.innerText.toUpperCase().indexOf(filter) > -1) ||
            (author.innerText.toUpperCase().indexOf(filter) > -1) ||
            (title.innerText.toUpperCase().indexOf(filter) > -1) ||
            (rating.innerText.toUpperCase().indexOf(filter) > -1) ||
            (pubDate.innerText.toUpperCase().indexOf(filter) > -1)) 
        {
            cards[i].style.display = "";
        } else {
            cards[i].style.display = "none";
        }
    }
}
