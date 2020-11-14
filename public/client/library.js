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
                }
            },
            error: function (jqXHR, textstatus, errorThrown) {
                console.log(textstatus)
                alert('Error occured while retrieving book')
            }
        })
    }
} 

// get book by title 
//app.get('/jobs/detail/(:id)', isAuthenticated, function (req, res, next) {
    var data{
        titles : []
        condition : []
    }

    sql.pool.query('SELECT Id, Title FROM Books ORDER BY Title',
        [param_id, req.session.userId], function (err, rows) {
            if (err) {
                req.flash('error', err)
                res.redirect('/jobs')
            } else if (rows.length > 0) {
                var data = {}
                data = rows[0]
                data.title = 'Job Detail'
                data.isEdit = isEdit
                isEdit = false
                if (rows[0].companyUrl) {
                    data.logo = companyLogo(rows[0].companyUrl, 50)
                } else {
                    data.logo = ''
                }

                data.status = []


    sql.pool.query(
        'SELECT Statuses.id, Statuses.label, CASE WHEN Jobs.id THEN ? ELSE ? END selected \
        FROM Statuses LEFT JOIN Jobs ON Statuses.id = Jobs.statusId AND Jobs.id =?',
        ['selected', '', param_id],
            function (err, rows) {
                if (err) {
                    req.flash('error', err)
                    res.redirect('/jobs')
                    } else {
                        for (var i = 0; i < rows.length; i++) {
                        data.status.push({ id: rows[i].id, label: rows[i].label, selected: rows[i].selected })
                        }

                        res.render('jobs/detail', data)
                        }
                    })
            }
            else {
                req.flash('error', 'Job could not be found for ID =' + param_id)
                res.redirect('/jobs')
            }
        })
})







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