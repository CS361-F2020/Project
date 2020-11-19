const express = require('express')
const router = express.Router()
const sql = require('../dbcon.js')
const bcrypt = require('bcryptjs')
const common = require('../common')


function Account(firstName, lastName, email, address, city, state, postalCode, country, worldwide, aboutMe) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.address = address;
    this.city = city;
    this.state = state;
    this.postalCode = postalCode;
    this.country = country;
    this.worldwide = worldwide;
    this.aboutMe = aboutMe
}


router.get('/', (req, res, next) =>{
    res.redirect('/search')
})

router.get('/home', common.isAuthenticated, (req, res, next) =>{
    var data = { title: 'Home' }
    res.redirect('/search')
})

router.get('/login', (req, res, next) =>{
    if (!req.session.user) {
        var data = { title: 'Login' }
        res.render('auth/login', data)
    } else {
        res.redirect('/home')
    }
})

router.post('/login', (req, res, next) =>{
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
                bcrypt.compare(req.body.password, results[0].password, function (err, isMatch) {
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
                        if (results[0].tempPassword) {
                            res.redirect('/resetpassword')
                        } else {
                            if (req.session.path)
                            {
                                res.redirect(req.session.path)
                            }
                            else
                            {
                                res.redirect('/home')
                            }          
                        }
                    }
                })
            }
        })
})

router.get('/logout', (req, res, next) =>{
    req.session.destroy()
    res.redirect('/login')
})

router.get('/resetpassword', common.isAuthenticated, (req, res, next) =>{
    var data = { title: 'Reset Password' }
    if (req.session.tempPassword) {
        req.flash('info', 'You logged in using a temporary password, please reset your password now.')
    }
    res.render('auth/resetpassword', data)
})

router.post('/resetpassword', common.isAuthenticated, (req, res, next) =>{
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
                    bcrypt.compare(data.password, results[0].password, function (err, isMatch) {
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
                                                req.session.tempPassword = false
                                                req.flash('success', 'Password reset was successful!')
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

router.get('/forgotpassword', (req, res, next) =>{
    var data = { title: 'Forgot Password' }
    res.render('auth/forgotpassword', data)
})

router.post('/forgotPassword', (req, res, next) =>{
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
                if (results[0].firstName == data.firstName && results[0].lastName == data.lastName) {
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
                                        text: 'Your new temporary password is: ' + tempPass
                                    }
                                    common.transport.sendMail(message)
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

router.get('/register', (req, res, next) =>{
    var data = { title: 'Register' }
    res.render('auth/register', data)
})

router.post('/register', (req, res, next) =>{
    var data = {
        title: 'Register',
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        country: req.body.country,
        worldwide: req.body.worldwide
    }

    if (data.password != data.confirmPassword)
    {
        req.flash('error', 'Password and confirm password must match')
        data.password = ''
        data.confirmPassword = ''
        res.render('auth/register', data)
    }
    else {
        sql.pool.query('SELECT * FROM Users WHERE email=?', [data.email],
        function (err, results) {
            if (err) {
                req.flash('error', err)
                res.render('auth/register', data)
            } else if (results.length > 0) {
                req.flash('error', 'There is already an account linked to this email address.')
                data.email = ''
                data.password = ''
                data.confirmPassword = ''
                res.render('auth/register', data)
            } else {
                bcrypt.hash(data.password, 10, function (err, hash) {
                    if (err) {
                        req.flash('error', err)
                        res.render('auth/register', data)
                    } else {
                        sql.pool.query('INSERT INTO Users (firstName, lastName, email, password, address, city, state, postalCode, country, worldwide)\
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.firstName, data.lastName, data.email, hash, data.address, data.city, data.state,
                        data.postalCode, data.country, data.worldwide], 
                        function (err, results) {
                            if (err) {
                                req.flash('error', err)
                                res.render('auth/register', data)
                            } else {
                                sql.pool.query('SELECT * FROM Users WHERE email=?', [data.email],
                                function(err, results){
                                    if (err) {
                                        req.flash('error', err)
                                        res.render('auth/register', data)
                                    } else if (results.length == 0) {
                                        req.flash('error', 'There was a problem with your registration')
                                        res.render('auth/register', data)
                                    } else {
                                        req.session.user = results[0].firstName + " " + results[0].lastName
                                        req.session.email = results[0].email
                                        req.session.userId = results[0].id
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

router.get('/preferences', common.isAuthenticated, (req, res, next) => {
    var data = { title : 'Preferences'}
    res.render('preferences', data);
})

router.get('/gettingstarted', common.isAuthenticated, (req, res, next) => {
    var data = { title: 'Getting Started'}
    res.render('gettingstarted', data);
})

router.get('/faq', common.isAuthenticated, (req, res, next) => {
    var data = { title: 'Frequently Asked Questions'}
    res.render('faq', data);
})

router.get('/updateaccount', common.isAuthenticated, (req, res, next) => {
    var payload = { title : 'Update Account Settings' }
    var data = [];
    //Select all information from database. Render form with values all as the existing information in users table.
    sql.pool.query('SELECT * FROM Users WHERE id=?', [req.session.userId],
    (err, results) => {
        if (err) {
            if (err) {
                req.flash('error', err)
                res.render('/auth/updateaccount', data)
            }
        } else {
            data.push(new Account(results[0].firstName, results[0].lastName, results[0].email, results[0].address, results[0].city, results[0].state, results[0].postalCode, results[0].country, results[0].worldwide, results[0].aboutMe));
        }
        payload.data = data;
        res.render('auth/updateaccount', payload);
    });
})

router.post('/updateaccount', common.isAuthenticated, (req, res, next) => {
    var payload = { title : 'Update Account Settings' }
    var response = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        country: req.body.country,
        worldwide: req.body.worldwide,
        aboutMe: req.body.aboutMe
    }
    sql.pool.query('SELECT id, email FROM Users WHERE email=?', [response.email],
    (err, results) => {
        if (results.length != 0 && results[0].id != req.session.userId) {
            req.flash("error", "This email is already associated with another account")
            data = [];
            data.push(new Account(response.firstName, response.lastName, "", response.address, response.city, response.state, response.postalCode, response.country, response.worldwide, response.aboutMe));
            payload.data = data;
            res.render('auth/updateaccount', payload);  
        } else {
            sql.pool.query('UPDATE Users SET ? WHERE id=?', [response, req.session.userId],
            (err, results) => {
                if (err) {
                    req.flash('error', err)
                    res.render('auth/updateaccount', response)
                } else {
                    //put alert on screen saying that the information was successfully updated. Reset session data in case anything changed
                    req.session.user = response.firstName + " " + response.lastName
                    req.session.email = response.email
                    response.title = 'Update Account Settings'
                    req.flash('success', 'Account Details Successfully Updated');
                    res.redirect('/myprofile');
                }
            })
        }
    })
})

router.get('/getAddress/(:id)', common.isAuthenticated, (req, res, next) => {
    var getAddress = 'SELECT firstName, lastName, address, city, state, postalCode, country FROM Users WHERE id = ?'
    sql.pool.query(getAddress, [req.params.id], (err, results) => {
        if (err || results.length == 0)
        {
            res.send({ error: 'Error retrieving buyer address. Please try again.' })
        }

        var result = results[0]
        var data = {
            fullName: result.firstName + ' ' + result.lastName,
            address: result.address,
            address2: result.city + ', ' + result.state + ' ' + result.postalCode,
            country: result.country
        }

        res.send(data)
    })
})

module.exports = router