const express = require('express')
const router = express.Router()
const sql = require('../dbcon.js')
const common = require('../common')

var today = new Date()

function Transaction(data) {
    this.userBookId = data.userBookId,
        this.buyerId = data.requestorId,
        this.sellerId = data.userId,
        this.buyerPoints = data.buyerPoints,
        this.sellerPoints = data.sellerPoints,
        this.rcvdOnTime = data.rcvdOnTime,
        this.conditionMatched = data.conditionMatched,
        this.statusId = data.statusId,
        this.lost = data.lost
}

function TransactionDb(data) {
    this.buyerPoints = data.buyerPoints,
        this.sellerPoints = data.sellerPoints,
        this.rcvdOnTime = data.rcvdOnTime,
        this.conditionMatched = data.conditionMatched,
        this.statusId = data.statusId,
        this.lost = data.lost
}

function getSellerEmail(t_id, callback) {
    var query = 'SELECT u.email, b.title FROM Transactions t\
                INNER JOIN UserBooks ub ON userBookId = ub.id\
                INNER JOIN Users u ON ub.userId = u.id\
                INNER JOIN Books b ON ub.bookId = b.id\
                WHERE t.id = ?'

    sql.pool.query(query, [t_id], (err, result) => {
        if (err) {
            return callback(err, '')
        }
        else if (result.length == 0) {
            return callback('No result found with id = ' + t_id, '')
        }
        else {
            return callback('', result[0])
        }
    })
}

function getTransaction(t_id, callback) {
    var query = 'SELECT t.*, ub.* FROM Transactions t INNER JOIN UserBooks ub ON t.userBookId = ub.Id WHERE t.id = ?'
    sql.pool.query(query, [t_id], (err, result) => {
        if (err) {
            return callback(err)
        }
        else if (result.length == 0) {
            return callback('No transaction was found with id = ' + t_id)
        }
        var object = new Transaction(result[0])
        return callback(null, object)
    })
}

function updateTransaction(t_obj, t_id, statusChange, callback) {
    var query = 'UPDATE Transactions SET ? WHERE id = ?'

    sql.pool.query(query, [t_obj, t_id], (err, result) => {
        if (err) {
            return callback(err)
        }

        if (statusChange == true) {
            addTransactionStatusRecord(t_id, t_obj.statusId, (err, result) => {
                if (err) {
                    return callback(err)
                }
            })
        }
    })
    return callback(null, 'success')
}

function addTransactionStatusRecord(t_id, s_id, callback) {
    var query = 'INSERT INTO TransactionStatusDates (transactionid, statusId, date) VALUES (?, ?, ?)'
    sql.pool.query(query, [t_id, s_id, today], (err, result) => {
        if (err) {
            return callback(err)
        }

        return callback(null, true)
    })
}

function updateBookAvailability(userBookId, available, callback) {
    var query = 'UPDATE UserBooks SET available = ? WHERE id = ?'
    sql.pool.query(query, [available, userBookId], (err, result) => {
        if (err) {
            return callback(err)
        }
        return callback(null, 'success')
    })
}

function updateBookAvailabilityByTransaction(transactionId, available, callback)
{
    var query = 'UPDATE UserBooks SET available = ? WHERE id = (SELECT userBookId FROM Transactions WHERE id = ?)'
    sql.pool.query(query, [available, transactionId], (err, result) => {
        if (err) {
            return callback(err)
        }
    })

    return callback(null, 'success')
}

function updateBuyerPoints(t_id, buyer_id, callback) {
    var query = 'UPDATE Users SET points = (SELECT SUM(t.points) FROM (SELECT points FROM Users WHERE id = ?\
        UNION ALL\
        SELECT buyerPoints AS points FROM Transactions WHERE id = ?) t) WHERE id = ?'

    sql.pool.query(query, [buyer_id, t_id, buyer_id], (err, result) => {
        if (err) {
            return callback(err)
        }
        return callback(null, 'success')
    })
}

function updateSellerPoints(t_id, seller_id, callback) {
    var query = 'UPDATE Users SET points = (SELECT SUM(t.points) FROM (SELECT points FROM Users WHERE id = ?\
    UNION ALL\
    SELECT sellerPoints AS points FROM Transactions WHERE id = ?) t) WHERE id = ?'

    sql.pool.query(query, [seller_id, t_id, seller_id], (err, result) => {
        if (err) {
            return callback(err)
        }

        return callback(null, 'success')
    })
}

router.get('/', common.isAuthenticated, (req, res) => {
    var data = {
        title: 'My Swaps',
        sent: [],
        received: []
    }

    var swaps =
        'SELECT "R" AS category, t.id, u.id AS userId, u.email, u.firstName, u.lastName, b.title, REPLACE(b.title, "\'", "") AS jsTitle, b.author, t.created, t.modified, t.statusId,\
        s.description AS status, CASE WHEN t.statusId = 8 THEN t.sellerPoints ELSE "Pending" END AS points, IFNULL(t.lost, 0) AS lost, c.description AS cond, CASE WHEN t.rating is NULL THEN 0 ELSE 1 END AS hasSurvey\
        FROM Transactions t\
            INNER JOIN Users u ON t.requestorId = u.id\
            INNER JOIN Statuses s ON t.statusId = s.id\
            INNER JOIN UserBooks ub ON t.userBookId = ub.id\
            INNER JOIN Conditions c ON ub.conditionId = c.id\
            INNER JOIN Books b ON ub.bookId = b.id\
        WHERE ub.userId = ?\
        UNION\
        SELECT "S" AS category, t.id, u.id AS userid, u.email, u.firstName, u.lastName, b.title, REPLACE(b.title, "\'", "") AS jsTitle, b.author, t.created, t.modified, t.statusId,\
        s.description AS status, CASE WHEN t.statusId = 8 THEN t.buyerPoints ELSE "Pending" END AS points, IFNULL(t.lost, 0) AS lost, c.description AS cond, CASE WHEN t.rating is NULL THEN 0 ELSE 1 END AS hasSurvey\
        FROM Transactions t\
            INNER JOIN Statuses s ON t.statusId = s.Id\
            INNER JOIN UserBooks ub ON t.userBookId = ub.id\
            INNER JOIN Users u ON ub.userId = u.id\
            INNER JOIN Conditions c ON ub.conditionId = c.id\
            INNER JOIN Books b ON ub.bookId = b.id\
        WHERE t.requestorId = ?'

    sql.pool.query(swaps, [req.session.userId, req.session.userId], (err, results) => {
        if (err) {
            req.flash('error', err)
            res.render('myswaps', data)
        }
        else if (results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                if (results[i].statusId != 8) {
                    results[i].category == 'S' ? data.sent.push(results[i]) : data.received.push(results[i])
                }
            }
            data.sentCount = data.sent ? data.sent.length : ''
            data.receivedCount = data.received ? data.received.length : ''
            data.history = results
            data.historyCount = results.length
        }
        res.render('myswaps', data)
    })
})

router.post('/notReceived', (req, res) => {
    var errorMsg = 'Error occurred while updating book status. Please try again or contact support at bookswaphelpdesk@gmail.com'

    var t_obj = {
        lost: 1
    }

    updateTransaction(t_obj, req.body.id, false, (err) => {
        if (err) {
            console.log(err)
            return res.send({ error: errorMsg })
        }

        getSellerEmail(req.body.id, (err, result) => {
            if (err) {
                console.log(err)
                return res.send({ error: errorMsg })
            }

            var message = {
                from: 'bookswap@gmail.com',
                to: result.email,
                subject: 'BookSwap: A Book You Sent Has Been Flagged as Not Received',
                text: result.title + ' has been flagged as not received by the buyer. Please login to book swap and update the status or contact the user directly.'
            }

            common.transport.sendMail(message)
            res.send({ success: 'success' })
        })
    })
})

router.post('/updateStatus', (req, res) => {
    var errorMsg = 'Error occurred while trying to update status. Please try again or contact support at bookswaphelpdesk@gmail.com'

    var t_obj = {
        statusId: req.body.statusId,
        modified: today
    }

    updateTransaction(t_obj, req.body.id, true, (err) => {
        if (err) {
            console.log(err)
            return res.send({ error: errorMsg })
        }

        if (req.body.statusId == 5 || req.body.statusId == 6) {
            updateBookAvailabilityByTransaction(req.body.id, 1, (err) => {
                if (err) {
                    console.log(err)
                    return res.send({ error: errorMsg })
                }
            })
        }
    })

    return res.send({ success: 'success' })
})

router.post('/close', (req, res) => {
    var errorMsg = 'Error occurred while trying to close the transaction. Please try again or contact support at bookswaphelpdesk@gmail.com'
    var available = req.body.statusId == 5 || req.body.statusId == 6 ? true : false
    getTransaction(req.body.id, (err, result) => {
        if (err) {
            console.log(err)
            return res.send({ error: errorMsg })
        }
        var originalObj = result
        var updatedObj = new TransactionDb(result)
        updatedObj.statusId = 8

        updateTransaction(updatedObj, req.body.id, true, (err, result) => {
            if (err) {
                console.log(err)
                return res.send({ error: errorMsg })
            }
            else if (result == 'success') {
                updateBookAvailability(originalObj.userBookId, available, (err, result) => {
                    if (err) {
                        console.log(err)
                        return res.send({ error: errorMsg })
                    }
                    else if (result == 'success') {
                        updateSellerPoints(req.body.id, originalObj.sellerId, (err, result) => {
                            if (err) {
                                console.log(err)
                                return res.send({ error: errorMsg })
                            }
                            else if (result == 'success') {
                                updateBuyerPoints(req.body.id, originalObj.buyerId, (err, result) => {
                                    if (err) {
                                        console.log(err)
                                        return res.send({ error: errorMsg })
                                    }                      
                                })
                            }
                        })
                    }
                })
            }
        })
    })

    res.send({ success: 'success' })
})

router.post('/survey/submit', (req, res) => {
    var errorMsg = 'Error occurred while saving survey. Please try again or contact support at bookswaphelpdesk@gmail.com'
    var successMsg = req.body.isNew == 'true' ? 'Thank you for submitting our swap survey!' : 'Your survey has been updated! Remember, once the swap is closed you cannot update your survey'

    var t_obj = {
        statusId: '4',
        rcvdOnTime: req.body.rcvdOnTime == '1' ? true : false,
        conditionMatched: req.body.conditionMatched == '1' ? true : false,
        rating: req.body.star,
        lost: false
    }

    var updateStatus = req.body.isNew == 'true' ? true : false;

    updateTransaction(t_obj, req.body.id, updateStatus, (err) => {
        if (err) {
            console.log(err)
            return res.send({ error: errorMsg })
        }
    })

    req.flash('success', successMsg)
    return res.send({ success: 'success' })
})

router.get('/survey/(:id)', common.isAuthenticated, (req, res) => {
    var getSurvey = 'SELECT t.rcvdOnTime, t.conditionMatched, t.rating, t.created, c.description as cond\
                     FROM Transactions t\
                        INNER JOIN UserBooks ub ON t.userBookId = ub.id\
                        INNER JOIN Conditions c ON ub.conditionId = c.id\
                     WHERE t.id = ?'
    var errorMsg = 'Error occurred while retrieving survey. Please try again or contact support at bookswaphelpdesk@gmail.com'

    sql.pool.query(getSurvey, [req.params.id], (err, results) => {
        if (err || results.length == 0) {
            return res.send({ error: errorMsg })
        }

        var data = {
            rcvdOnTime: results[0].rcvdOnTime ? 1 : 0,
            conditionMatched: results[0].conditionMatched ? 1 : 0,
            star: results[0].rating,
            created: results[0].created,
            condition: results[0].cond
        }

        return res.send(data)
    })
})

router.get('/history/(:id)', (req, res) => {
    var getHistory = 'SELECT s.description AS status, tsd.date \
                      FROM TransactionStatusDates tsd \
                        INNER JOIN Statuses s ON tsd.statusId = s.id \
                      WHERE tsd.transactionId = ?'

    sql.pool.query(getHistory, [req.params.id], (err, results) => {
        return res.send({ data: results })
    })
})

module.exports = router