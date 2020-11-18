// request button- activate modal
function requestBook(bookId, pointCost, title, userPoints){
    var modalBody = document.getElementById('modalBody');
    if(pointCost > userPoints){
        
        $("#pointsModal").modal("show");
    }
    else{
        
        modalBody.innerHTML = `Are you sure you want this book?: <br> <b>"${title}"</b>`
        var confirmButton = document.getElementById('confirmButton');
        confirmButton.setAttribute("onclick", `request(${bookId}, ${pointCost}, '${title}')`);
        // toogle modal
        $("#pageModal").modal("toggle");
    }
}

// AJAX request a book
function request(bookId, pointCost, title){
    console.log(title);
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

function bookDetails(isbn, pointCost, userPoints){
        $.ajax({
            url: '/googleapi/isbn/' + isbn,
            method: 'GET',
            dataType: 'json',
            success: function (res) {
                console.log(res);
                
                var details = document.getElementById('details');
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