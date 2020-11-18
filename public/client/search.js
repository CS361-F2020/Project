// request button- activate modal
function requestBook(bookId, pointCost, title){
    var modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `Are you sure you want this book?: <br> <b>"${title}"</b>`
    var confirmButton = document.getElementById('confirmButton');
    confirmButton.setAttribute("onclick", `request(${bookId}, ${pointCost}, '${title}')`);
    // toogle modal
    $("#pageModal").modal("toggle");
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