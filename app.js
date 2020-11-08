const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const handlebars = require('express-handlebars').create({ defaultLayout: 'main' })
const session = require('express-session')
const flash = require('express-flash')

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
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static("public"))
app.use(flash())

// Routes
app.use('/', require('./routes/index.js'))
app.use('/googleapi', require('./routes/googleapi.js'))
app.use('/mylibrary', require('./routes/mylibrary.js'))
app.use('/myprofile', require('./routes/myprofile.js'))
app.use('/search', require('./routes/search.js'))

app.use(function (req, res) {
    res.status(404)
    res.render('errors/404')
})

app.use(function (err, req, res, next) {
    console.log(err.stack)
    res.status(500)
    res.render('errors/500')
})

app.listen(app.get("port"), function () {
    console.log(`Express started on http://${process.env.HOSTNAME}:${app.get('port')}; press Ctrl-C to terminate.`);
})
