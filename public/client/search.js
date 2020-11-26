// request button- activate modal
function requestBook(bookId, pointCost, title, userPoints, condition, date){
    var condition = condition.split(',');
    var date = date.split(',');
    var modalBody = document.getElementById('modalBody');
    var selector = document.getElementsByTagName('select')[0];
    if(selector != undefined){
        var div1 = document.getElementById("div1")
        modalBody.removeChild(div1);
    }
    if(pointCost > userPoints){
        $("#pointsModal").modal("show");
    }
    else if(bookId.length > 1){
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
        selector.setAttribute("onchange", `confirmButton(${pointCost}, '${title}')`);
        // set a placeholder option
        var option = document.createElement("option");
        option.innerHTML="Please Select a Copy";
        option.setAttribute("disabled", "disabled");
        option.setAttribute("selected", "selected");
        selector.appendChild(option);
        div2.appendChild(selector);
        div1.appendChild(div2);
        // set all available options
        for (var i = 0; i < bookId.length; i++){
            var option2 = document.createElement("option");
            option2.value = bookId[i];
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
        modalBody.innerHTML = `Are you sure you want this book?: <br> <b>"${title}"</b>`
        var confirmButton = document.getElementById('confirmButton');
        confirmButton.setAttribute("onclick", `request(${bookId[0]}, ${pointCost}, '${title}')`);
        // toogle modal
        $("#pageModal").modal("toggle");
    }
}

// Remove confirm button functionality
function removeOptions(){
    var confirmButton = document.getElementById('confirmButton');
    confirmButton.removeAttribute("onclick");
}

// button is active only if an option is selected
function confirmButton(pointCost, title){
    var confirmButton = document.getElementById('confirmButton');
    confirmButton.setAttribute("onclick", `requestCopies(${pointCost}, '${title}')`);
}

// AJAX request a book multiple copies avilable
function requestCopies(pointCost, title){
    var selected = document.getElementById("selector");
    var bookId = selected.value;
    var options = Array.from(selected.children);
    console.log(options)
    $.ajax({
        url: '/search',
        method: 'POST',
        dataType: 'json',
        data: {'bookId': bookId, 'title': title, 'pointCost': pointCost},
        success: function (res) {
            // reload the load the page to display the correct cards
            // hide the modal
            $('#pageModal').modal('hide');
            location.reload()
        },
        error: function (jqXHR, textstatus, errorThrown) {
            console.log(textstatus)
            alert('Error occured while retrieving book')
        }
    })
}

// AJAX request a book only one copy avilable
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
