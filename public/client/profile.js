//updates about me.
const url = window.location.href;


function newupdateAboutMe() {
    var updatedAboutMe = document.getElementById('newAboutMe').value;
    var data = {'aboutMe': updatedAboutMe };
    var req = new XMLHttpRequest();
    req.open('POST', url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(data));
    req.addEventListener('load', () => {
        if (JSON.parse(req.response).update == true) {
            location.reload(true);
        }
    });
}