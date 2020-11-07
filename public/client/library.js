const url = window.location.href;

// toggle shelf icons
$('#topShelf').on("click", () => {
    $('#topShelf').toggleClass("fa-chevron-up fa-chevron-down");
    toggleToolTips('#topShelfTip');
});
$('#bottomShelf').on("click", () => {
    $('#bottomShelf').toggleClass("fa-chevron-up fa-chevron-down");
    toggleToolTips('#bottomShelfTip');
});
// initiallize tooltips
$(() => {
    $('[data-toggle="tooltip"]').tooltip()
});

// toogle tooltip for accordion
function toggleToolTips(tipId) {
    if ($(tipId).attr('data-original-title') == 'click here to<br>see less') {
        $(tipId).tooltip('hide').attr('data-original-title', 'click here to<br>see more').tooltip('show');
    } else {
        $(tipId).tooltip('hide').attr('data-original-title', 'click here to<br>see less').tooltip('show');
    }
}

// toggle modal dispay
function clickRemove(userBookId, title) {
    var modalLabel = document.getElementById('modalLabel');
    modalLabel.innerHTML = "Confirm Book Removal";
    var modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `Are you sure you want to remove <b>"${title}"</b> from your library?`
    var confirmButton = document.getElementById('confirmButton');
    confirmButton.setAttribute("onclick", `remove(${userBookId})`);
    $("#pageModal").modal("toggle")
};

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
            // update the modal to a sucsess... or some other type of alert
            $('#pageModal').modal('hide')
        } else {
            // update the modal to an error msg
        }
    });
};

function addBook(){
    var formArray = $('#addBookForm').serializeArray()
    var formData = {}

    $.each(formArray,
        function(i, v) {
            if (v.name != "isbn"){
                formData[v.name] = v.value
            }
    })

    $.ajax({
        url: '/mylibrary/add',
        method: 'POST',
        dataType: 'json',
        data: JSON.stringify(formData),
        contentType: "application/json",
        success: function (res) {
            // if response contains an error, display in error alert
            if (res.error) {
                $('#modal-alert-error').removeClass('d-none').text(res.error)
            } 
            // if success, hide the modal, redirect and display message
            else
            {
                $('#addBookModal').modal('hide')
                location.reload()
            } 
        },
        error: function (jqXHR, textstatus, errorThrown) {
            console.log(textstatus)
            alert('Error occured while adding book')
        }
    })
}