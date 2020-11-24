$(document).ready(function () {
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();
    });

    $('table.table-swap').DataTable({
        scrollY: 200,
        scrollCollapse: true,
        paging: false,
        order: [[4, "desc"]],
        columnDefs: [{
            orderable: false,
            targets: ["no-sort"]
        },
        {
            visible: false,
            targets: [0]
        }]

    });

    // on load of the page: switch to the currently selected tab
    var hash = window.location.hash;
    $('#swapTabs a[href="' + hash + '"]').tab('show');
})

function viewHistory(id) {    
    var table = $('#historyTable').DataTable({
        destroy: true,
        order: [[1, "asc"]],
        searching: false,
        paging: false,
        bInfo: false,
        processing: true,
        serverSide: true,
        ajax: "myswaps/history/" + id,
        columns: [
            { "data": "status" },
            { "data": "date" }
        ]
    });

    table.ajax.url( 'myswaps/history/' + id ).load();
    $('#historyModal').modal('show')
}

$('#surveyModal').on('hidden.bs.modal', function (e) {
    $('#surveyForm').trigger("reset")
    $('input:radio[name=rcvdOnTime]').attr('disabled', false)
    $('input:radio[name=conditionMatched]').attr('disabled', false)
    $('input:radio[name=star]').attr('disabled', false)
    $('#newSurveyBtn').removeClass('d-none')
    $('#editSurveyBtn').addClass('d-none')
})

$('#swapTabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
})

// store the currently selected tab in the hash value
$("ul.nav-tabs > li > a").on("shown.bs.tab", function (e) {
    var id = $(e.target).attr("href").substr(1);
    window.location.hash = id;
})

$('.survey_modal').click(function (e) {
    var id = $(this).attr('data-id')
    var condition = $(this).attr('data-condition')
    var created = $(this).attr('data-created')
    $('#surveyId').val(id)
    $('#requestDate').text('Request made on: ' + created)
    $('#sellerCondition').text('Seller listed condition: ' + condition)
})

function updateStatus(id, newStatusId, title) {
    // create alert message based on status
    var message = ''
    if (newStatusId == 2) {
        message = 'Please confirm you want to accept the swap for ' + title + '.\n\n' +
            'Once accepted, the requestor should receive the book within 10 days and in the listed condition.\nIf these terms are not met, you will not receieve any points for this swap.'
    }
    else if (newStatusId == 3) {
        message = 'Please confirm you have shipped the book ' + title + '.\n\n' +
            'Remember, the book must be received within 10 days of acceptance.'
    }
    else if (newStatusId == 5) {
        message = 'Please confirm you want to reject the swap for ' + title + '.\n\nThis will make the book available to other users.'
    }
    else if (newStatusId == 6) {
        message = 'Please confirm you want to cancel the request you made for ' + title + '.\n\nThis will make the book available to other users.'
    }
    else if (newStatusId == 7) {
        message = 'Please confirm you want to mark the book ' + title + ' as lost.\n\nYou will still receive half of your points and this will count towards your 2 lost book limit for this year.'
    }

    // if the user confirms, continue with update
    if (confirm(message)) {
        var data = {
            id: id,
            statusId: newStatusId
        }

        $.ajax({
            url: 'myswaps/updatestatus',
            method: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function (res) {
                // if response contains an error, display in error alert
                if (res.error) {
                    $('#alert-error').removeClass('d-none').text(res.error)
                }
                // if success, reload the page
                else {
                    location.reload()
                }
            },
            error: function (jqXHR, textstatus, errorThrown) {
                console.log(textstatus)
                alert('Error occured while updating status')
            }
        })
    }
    // else return
    else {
        return
    }
}

function notReceived(id, title) {
    var message = 'Please confirm you are marking this book as not received.\nThe seller will be notified and may be able to provide more details on the shipping status.\nIf you do receive the book, please remember to come back and mark as received!'

    if (confirm(message)) {
        var data = {
            id: id
        }

        $.ajax({
            url: 'myswaps/notReceived',
            method: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function (res) {
                // if response contains an error, display in error alert
                if (res.error) {
                    $('#alert-error').removeClass('d-none').text(res.error)
                }
                // if success, reload the page
                else {
                    location.reload()
                }
            },
            error: function (jqXHR, textstatus, errorThrown) {
                console.log(textstatus)
                alert('Error occured while updating status')
            }
        })
    }
}

function closeSwap(id, statusId, title) {
    //create alert message based on status
    var message = 'Please confirm you want to finalize the swap for ' + title + '.\n\n'
    if (statusId == 4) {
        message += 'The requestor has marked this book as received.\nYour points will be made available once this swap is closed.'
    }
    else if (statusId == 5) {
        message += 'The seller has rejected your request for this book.\nBy closing this swap, you are confirming you understand you will not receive this book.\nAll pending points will be made available immediately.'
    }
    else if (statusId == 6) {
        message += 'This swap has been cancelled by the requestor.\nYou will not receive any points for this swap.'
    }
    else if (statusId == 7) {
        message += 'The seller has marked this book as lost.\nBy closing this swap you are confirming the book was lost during shipping.\nYou will not be charged for this swap.'
    }

    // if the user confirms, continue with close
    if (confirm(message)) {
        var data = {
            id: id,
            statusId: statusId
        }

        $.ajax({
            url: 'myswaps/close',
            method: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function (res) {
                // if response contains an error, display in error alert
                if (res.error) {
                    $('#alert-error').removeClass('d-none').text(res.error)
                }
                // if success, reload the page
                else {
                    location.reload()
                }
            },
            error: function (jqXHR, textstatus, errorThrown) {
                console.log(textstatus)
                alert('Error occured while updating status')
            }
        })
    }
    // else return
    else {
        return
    }
}

function submitSurvey(isNew) {
    // serialize array
    var formArray = $('#surveyForm').serializeArray()
    var formData = {}

    $.each(formArray,
        function (i, v) {
            formData[v.name] = v.value
        })
    
    formData.id = $('#surveyId').val()
    formData.isNew = isNew

    $.ajax({
        url: '/myswaps/survey/submit',
        method: 'POST',
        dataType: 'json',
        data: JSON.stringify(formData),
        contentType: "application/json",
        success: function (res) {
            // if response contains an error, display in error alert
            if (res.error) {
                $('#survey-modal-alert-error').removeClass('d-none').text(res.error)
            }
            // if success, hide the modal, redirect and reload page
            else {
                $('#surveyModal').modal('hide')
                //$('#alert-success').removeClass('d-none').text(res.success)
                location.reload()
            }
        },
        error: function (jqXHR, textstatus, errorThrown) {
            console.log(textstatus)
            alert('Error occured while submitting survey')
        }
    })
}

function viewSurvey(id, title, readOnly)
{
    $.ajax({
        url: '/myswaps/survey/' + id,
        method: 'GET',
        dataType: 'json',
        success: function (res) {
            // if response contains an error, display in error alert
            if (res.error) {
                $('#alert-error').removeClass('d-none').text(res.error)
            } 
            // if no error or message, populate fields with address info
            else {
                $('#surveyTitle').text('Survey for ' + title)
                $('#requestDate').text('Request made on: ' + res.created)
                $('#sellerCondition').text('Seller listed condition: ' + res.condition)
                $("input[name='surveyid']").val(id)
                $('input:radio[name=rcvdOnTime]').val([res.rcvdOnTime])
                $('input:radio[name=conditionMatched]').val([res.conditionMatched])
                $('input:radio[name=star]').val([res.star])
                $('#newSurveyBtn').addClass('d-none')
                $('#editSurveyBtn').removeClass('d-none')

                if (readOnly == 1)
                {
                    $('input:radio[name=rcvdOnTime]').attr('disabled', true)
                    $('input:radio[name=conditionMatched]').attr('disabled', true)
                    $('input:radio[name=star]').attr('disabled', true)
                    $('#newSurveyBtn').addClass('d-none')
                    $('#editSurveyBtn').addClass('d-none')
                }

                $('#surveyModal').modal('show')
            }
        },
        error: function (jqXHR, textstatus, errorThrown) {
            console.log(textstatus)
            alert('Error occured while retrieving survey')
        }
    })
}

function getAddress(userId)
{
    $.ajax({
        url: '/getaddress/' + userId,
        method: 'GET',
        dataType: 'json',
        success: function (res) {
            // if response contains an error, display in error alert
            if (res.error) {
                $('#alert-error').removeClass('d-none').text(res.error)
            } 
            // if no error or message, populate fields with address info
            else {
                $("#name").text(res.fullName)
                $("#address").text(res.address)
                $("#address2").text(res.address2)
                $("#country").text('Country: ' + res.country)

                $('#addressModal').modal('show')
            }
        },
        error: function (jqXHR, textstatus, errorThrown) {
            console.log(textstatus)
            alert('Error occured while getting address')
        }
    })
}