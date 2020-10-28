const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const handlebars = require('express-handlebars').create({ defaultLayout: 'main' })
const sql = require('./dbcon.js')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
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
app.portNumber = app.get('port')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static("public"))
app.use(flash())

let transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: '03dc146876fe03',
        pass: '636903cf2bb0cc'
    }
})

function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'You must be logged in to use this function')
        res.redirect('/login')
    } else {
        next()
    }
}

app.get('/', function (req, res, next) {
    res.redirect('/home')
})

app.get('/home', isAuthenticated, function (req, res, next) {
    var data = { title: 'Home' }
    res.render('home', data)
})

app.get('/login', function (req, res, next) {
    if (!req.session.user) {
        var data = { title: 'Login' }
        res.render('auth/login', data)
    } else {
        res.redirect('/home')
    }
})

app.get('/logout', function (req, res, next) {
    req.session.destroy()
    res.redirect('/login')
})

app.get('/resetpassword', isAuthenticated, function (req, res, next) {
    var data = { title: 'Reset Password' }
    if (req.session.tempPass) {
        req.flash('info', 'You logged in using a temporary password, please reset your password now.')
    }
    res.render('auth/resetpassword', data)
})

app.post('/resetpassword', isAuthenticated, function (req, res, next) {
    var data = {
        title: 'Reset Password',
        password: req.body.password,
        newPassword: req.body.newPassword,
        confirmPassword: req.body.confirmPassword
    }

    if (data.newPassword != data.confirmPassword) {
        req.flash('error', 'New password and confirm password must match.')
        data.newPassword = ''
        data.confirmPassword = ''
        res.render('auth/resetpassword', data)
    }
    else {
        sql.pool.query('SELECT * FROM Users WHERE id=?', [req.session.userId],
            function (err, results) {
                if (err) {
                    req.flash('error', err)
                    res.render('auth/resetpassword', data)
                } else {
                    bcrypt.compare(data.password, results[0].psword, function (err, isMatch) {
                        if (err) {
                            req.flash('error', err)
                            res.render('auth/resetpassword', data)
                        } else if (!isMatch) {
                            req.flash('error', 'Current password is incorrect. Please try again.')
                            data.password = ''
                            res.render('auth/resetpassword', data)
                        } else {
                            bcrypt.hash(data.newPassword, 10, function (err, hash) {
                                if (err) {
                                    req.flash('error', err)
                                    res.render('auth/resetpassword', data)
                                } else {
                                    sql.pool.query('UPDATE Users SET password=?, tempPassword=0 WHERE id=?', [hash, req.session.userId],
                                        function (err, results) {
                                            if (err) {
                                                req.flash('error', err)
                                                res.render('auth/resetpassword', data)
                                            } else {
                                                req.session.tempPass = false
                                                res.redirect('/home')
                                            }
                                        })
                                }
                            })
                        }
                    })
                }
            })
    }
})

app.get('/forgotpassword', function (req, res, next) {
    var data = { title: 'Forgot Password' }
    res.render('auth/forgotpassword', data)
})

app.post('/forgotPassword', function (req, res, next) {
    var data = {
        title: 'Forgot Password',
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
    }


    sql.pool.query('SELECT * FROM Users WHERE email=?', [data.email],
        function (err, results) {
            if (err) {
                req.flash('error', err)
                res.render('auth/forgotpassword', data)
            } else if (results.length > 0) {
                if (results[0].FirstName == data.firstName && results[0].LastName == data.lastName) {
                    var tempPass = Math.random().toString(36).slice(-8)
                    bcrypt.hash(tempPass, 10, function (err, hash) {
                        sql.pool.query('UPDATE Users SET password=?, tempPassword=1 WHERE id=?', [hash, results[0].id],
                            function (err, results) {
                                if (err) {
                                    req.flash('error', err)
                                    res.render('auth/forgotpassword', data)
                                } else {
                                    var message = {
                                        from: 'bookswap@gmail.com',
                                        to: req.body.email,
                                        subject: 'BookSwap: Request for temporary password',
                                        text: 'Your new temporary password is: ' + tempPass + '.'
                                    }
                                    transport.sendMail(message)
                                }
                            })
                    })
                }
                req.flash('success', 'Password request successful, you should receive an email with a temporary password')
                res.redirect('/login')
            } else {
                req.flash('success', 'Password request successful, you should receive an email with a temporary password')
                res.redirect('/login')
            }
        })
})

app.post('/login', function (req, res, next) {
    var data = {
        title: 'Login',
        email: req.body.email,
        password: req.body.password
    }

    sql.pool.query('SELECT * FROM Users WHERE email=?', [data.email],
        function (err, results) {
            if (err) {
                req.flash('error', err)
                res.render('auth/login', data)
            } else if (results.length <= 0) {
                req.flash('error', 'Email is incorrect. Please try again.')
                res.render('auth/login')
            } else {
                bcrypt.compare(req.body.password, results[0].psword, function (err, isMatch) {
                    if (err) {
                        req.flash('error', err)
                        res.render('auth/login', data)
                    } else if (!isMatch) {
                        req.flash('error', 'Password is incorrect. Please try again.')
                        data.password = ''
                        res.render('auth/login', data)
                    } else {
                        req.session.user = results[0].firstName + " " + results[0].lastName
                        req.session.email = results[0].email
                        req.session.tempPassword = results[0].tempPassword
                        req.session.userId = results[0].id
                        if (results[0].tempPass) {
                            res.redirect('/resetpassword')
                        } else {
                            res.redirect('/home')
                        }
                    }
                })
            }
        })
})

// route for my library
app.use('/mylibrary', require('./routes/mylibrary.js'));

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