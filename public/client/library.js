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
function clickRemove(userBookId, title, condition, date) {
    var modalLabel = document.getElementById('modalLabel');
    modalLabel.innerHTML = "Confirm Book Removal";
    var modalBody = document.getElementById('modalBody');
    if(userBookId.length > 1){
        var condition = condition.split(',');
        var date = date.split(',');
        modalBody.innerHTML = `Are you sure you want this book?: <br> <b>"${title}"</b><br>`
        var div1 = document.createElement("div");
        div1.id = "div1";
        div1.setAttribute("class", "form-row")
        var div2 = document.createElement("div");
        div2.setAttribute("class", "form-group col-12");
        var selector = document.createElement("select");
        selector.id = "selector";
        selector.setAttribute("class", "form-control");
        selector.setAttribute("required", "required");
        selector.setAttribute("onchange", 'activateButton()');
        // set a placeholder option
        var option = document.createElement("option");
        option.innerHTML="Please Select a Copy";
        option.setAttribute("disabled", "disabled");
        option.setAttribute("selected", "selected");
        selector.appendChild(option);
        div2.appendChild(selector);
        div1.appendChild(div2);
        // set all available options
        for (var i = 0; i < userBookId.length; i++){
            var option2 = document.createElement("option");
            option2.value = userBookId[i];
            option2.innerHTML = `Listing date: ${date[i]}, Condition : ${condition[i]}`;
            selector.appendChild(option2);
        }
        var br = document.createElement("br")
        modalBody.appendChild(br)
        modalBody.appendChild(div1);
        // // toogle modal
        $("#pageModal").modal("toggle");
    }
    else{
        modalBody.innerHTML = `Are you sure you want to remove <b>"${title}"</b> from your library?`
        var confirmButton = document.getElementById('confirmButton');
        confirmButton.setAttribute("onclick", `remove(${userBookId})`);
        $("#pageModal").modal("toggle")
    }
};

// Remove confirm button functionality
function removeOptions(){
    var confirmButton = document.getElementById('confirmButton');
    confirmButton.removeAttribute("onclick");
}

// Button is active only if an option is selected
function activateButton(){
    var selector = document.getElementById('selector');
    var userBookId = selector.value;
    var confirmButton = document.getElementById('confirmButton');
    confirmButton.setAttribute("onclick", `remove(${userBookId})`);
}

// remove a book from user mylibrary
function remove(userBookId) {
    $.ajax({
        url: '/mylibrary',
        method: 'DELETE',
        dataType: 'json',
        data: JSON.stringify({ 'userBookId': userBookId }),
        contentType: "application/json",
        success: function (res) {
            // if response contains an error, display in error alert
            if (res.error) {
                $('#modal-alert-error').removeClass('d-none').text(res.error)
            } 
            // if success, hide the modal, redirect and display message
            else
            {
                $('#pageModal').modal('hide')
                location.reload()
            } 
        },
        error: function (jqXHR, textstatus, errorThrown) {
            console.log(textstatus)
            alert('Error occured while adding book')
        }
    })
};

function clearSearch() {
    // reset add book form, hide fields
    $('.google-field').addClass('d-none')
    $('.alert').addClass('d-none')
    $('#addBookForm').trigger("reset")
    $('#inputid').prop('readonly', false)
}

$('#bookModal').on('hidden.bs.modal', function (e) {
    clearSearch()
  })

function getBookDetailsByISBN() {
    // hide elements fail safe
    $('.alert').addClass('d-none')
    $('.google-field').addClass('d-none')

    // get input
    var inputId = $('#inputid').val()

    // validate input is not empty
    if (!inputId || inputId.length == 0) {
        $('#modal-alert-error').removeClass('d-none').text("Please enter a value for ISBN")
    }
    // validate input is 10 or 13 characters
    else if (inputId.length != 10 && inputId.length != 13) {
        $('#modal-alert-error').removeClass('d-none').text("Value must be 10 or 13 characters long")
    }
    // if input is valid, make api call to get book details
    else {
        $.ajax({
            url: '/googleapi/isbn/' + inputId,
            method: 'GET',
            dataType: 'json',
            success: function (res) {
                // if response contains an error, display in error alert
                if (res.error) {
                    $('#modal-alert-error').removeClass('d-none').text(res.error)
                } 
                // if response contains a message, display in info alert
                else if (res.message) 
                {
                    $('#modal-alert-info').removeClass('d-none').text(res.message)
                } 
                // if no error or message, populate fields with book info
                else {
                    $("input[name='title']").val(res.title)
                    $("input[name='author']").val(res.author)
                    $("input[name='genre']").val(res.genre)
                    $("input[name='language']").val(res.language)
                    $("input[name='rating']").val(res.rating)
                    $("input[name='pageCount']").val(res.pagecount)
                    $("input[name='pubDate']").val(res.pubDate)
                    $("input[name='imgUrl']").val(res.imgUrl)
                    $("input[name='isbn10']").val(res.isbn10)
                    $("input[name='isbn13']").val(res.isbn13)


                    // show hidden elements once populated
                    $('.google-field').removeClass('d-none')

                    // setting the input id to readonly so user cannot change
                    $('#inputid').prop('readonly', true)
                    // setting the title id to readonly so user cannot change
                    $('#titleselect').addClass('d-none')
                }
            },
            error: function (jqXHR, textstatus, errorThrown) {
                console.log(textstatus)
                alert('Error occured while retrieving book')
            }
        })
    }
} 

function populateISBN() {
    // get input
    var isbn = $('#titleid').val()
    $('#inputid').val(isbn)
    getBookDetailsByISBN()
}


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