var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var handlebars = require('express-handlebars').create({ defaultLayout: 'main' })
var sql = require('./dbcon.js')
var session = require('express-session')
var bcrypt = require('bcryptjs')
var today = new Date()
var nodemailer = require('nodemailer')
var flash = require('express-flash')

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1 * 1000
    }
}))

app.use(function (req, res, next) {
    res.locals.session = req.session
    next()
})

app.engine("handlebars", handlebars.engine)
app.set("view engine", "handlebars")
app.set('port', process.argv[2])
app.portNumber = app.get('port')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static("public"))
app.use(flash())

function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'You must be logged in to use this function')
        res.redirect('/login')
    } else {
        next()
    }
}

function isAdmin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login')
    } else if (!req.session.isAdmin) {
        res.render('unauthorized')
    } else {
        next()
    }
}

app.get('/', function (req, res, next) {
    res.redirect('/home')
})

app.get('/admin', isAdmin, function (req, res, next) {
    var data = { title: 'Application Administration' }
    res.render('admin', data)
})

app.get('/home', isAuthenticated, function (req, res, next) {
    var data = { title: 'Home' }
    res.render('home', data)
})

app.get('/login', function (req, res, next) {
    if (!req.session.user) {
        var data = { title: 'Login' }
        res.render('login', data)
    } else {
        res.redirect('/home')
    }
})

app.get('/logout', function (req, res, next) {
    req.session.destroy()
    res.redirect('/login')
})

app.use(function (req, res) {
    res.status(404)
    res.render('404')
})

app.use(function (err, req, res, next) {
    console.log(err.stack)
    res.status(500)
    res.render('500')
})

app.listen(app.get("port"), function () {
    console.log("Express started on http://flipX.engr.oregonstate.edu:" + app.get("port") + " press Ctrl-C to terminate.")
})