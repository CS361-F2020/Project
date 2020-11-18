// request button- activate modal
function requestBook(bookId, pointCost, title, userPoints){
    var modalBody = document.getElementById('modalBody');
    if(pointCost > userPoints){
        modalBody.innerHTML = `<b>You do not have enough points.</b><br>
        <ul>
            <li>You earn 1 point when you post a book.</li>
            <li>You earn points when you respond to a request and ship a book successfully.</li>
            <ul>
                <li>2 points are earned if sent to your current country.</li>
                <li>4 points are earned if sent to another country.</li>  
            </ul>     
        </ul>
        <a href="/search/pointsFAQ" class = "btn btn-info" role = "button">Learn more about the point system</a>`;
        
        $("#pageModal").modal("show");
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
                
                details.innerHTML = `Title: ${res.title}
                                    <br>
                                    Author: ${res.author}
                                    <br>
                                    Genre: ${res.genre}
                                    <br>
                                    Language: ${res.language} 
                                    <br>
                                    Point Cost: ${pointCost}
                                    <br>
                                    Rating: ${res.rating}
                                    <br>
                                    <a href="${res.googleLink}" class = "btn btn-info" role = "button">Google Link</a>
                                    <br>
                                    Description:
                                    <br>${res.description}`;   
                $("#detailModal").modal("show");
                
            },
            error: function (jqXHR, textstatus, errorThrown) {
                console.log(textstatus)
                alert('Error occured while retrieving book')
            }
        })
    
    
}