const nodemailer = require('nodemailer')

var transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'bookswaphelpdesk@gmail.com',
        pass: 'bookSwapFirst!361'
    }
})

function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login')
    } else {
        next()
    }
}

module.exports = {
    isAuthenticated,
    transport
}