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
                //need to turn this into a button
                //$("#detailGoogleLink").text(res.googleLink)
                $("#detailDescription").text(res.description)
               
                $("#detailModal").modal("show");
                
            },
            error: function (jqXHR, textstatus, errorThrown) {
                console.log(textstatus)
                alert('Error occured while retrieving book')
            }
        })  
}

function filterSearchResults() {
    var input, filter, cards, cardContainer, p, title, i;
    input = document.getElementById("myFilter");
    filter = input.value.toUpperCase();
    cardContainer = document.getElementById("myItems");
    cards = cardContainer.getElementsByClassName("card");
    var selection = document.getElementById("mySelect").selectedIndex;
    switch(selection){
        case 0:
            text = ".card-body p.card-genre";
            break;
        case 1:
            text = ".card-body p.card-author";
            break;
        case 2:
            text = ".card-body p.card-title";
            break;
        case 3:
            text = ".card-body p.card-rating";
            break;
        case 4:
            text = ".card-body p.card-pubdate";
            break;
    }
    for (i = 0; i < cards.length; i++) {
        title = cards[i].querySelector(text);
        if (title.innerText.toUpperCase().indexOf(filter) > -1) {
            cards[i].style.display = "";
        } else {
            cards[i].style.display = "none";
        }
    }
}
