const express = require('express')
const router = express.Router()
const sql = require('../dbcon.js')
const common = require('../common')

var today = new Date()

router.get('/', common.isAuthenticated, (req, res, next) => {
    var data = {
        title: 'My Swaps',
        sent: [],
        received: []
    }

    var swaps =
        'SELECT "R" AS category, t.id, u.id AS userId, u.email, u.firstName, u.lastName, b.title, REPLACE(b.title, "\'", "") AS jsTitle, b.author, t.created, t.modified, t.statusId,\
    s.description AS status, CASE WHEN t.statusId = 8 THEN t.sellerPoints ELSE "Pending" END AS points, t.lost, c.description AS cond, CASE WHEN t.rating is NULL THEN 0 ELSE 1 END AS hasSurvey\
    FROM Transactions t\
        INNER JOIN Users u ON t.requestorId = u.id\
        INNER JOIN Statuses s ON t.statusId = s.id\
        INNER JOIN UserBooks ub ON t.userBookId = ub.id\
        INNER JOIN Conditions c ON ub.conditionId = c.id\
        INNER JOIN Books b ON ub.bookId = b.id\
    WHERE ub.userId = ?\
    UNION\
    SELECT "S" AS category, t.id, u.id AS userid, u.email, u.firstName, u.lastName, b.title, REPLACE(b.title, "\'", "") AS jsTitle, b.author, t.created, t.modified, t.statusId,\
    s.description AS status, CASE WHEN t.statusId = 8 THEN t.buyerPoints ELSE "Pending" END AS points, t.lost, c.description AS cond, CASE WHEN t.rating is NULL THEN 0 ELSE 1 END AS hasSurvey\
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

router.post('/notReceived', (req, res, next) => {
    var updateLostFlag = 'UPDATE Transactions SET lost = 1, modified = ? WHERE id = ?'
    var getSeller = 'SELECT u.Email, t.title FROM Transactions t\
                        INNER JOIN UserBooks ub ON t.userBookId = ub.id\
                        INNER JOIN Users u ON ub.userId = u.id\
                        WHERE t.id = ?'

    sql.pool.query(updateLostFlag, [today, req.body.id], (err, results) => {
        if (err) {
            return res.send({ error: 'Error occurred when trying to mark book as not received. Please try again.' })
        }

        sql.pool.query(getSeller, [req.body.id], (err, results) => {
            if (err) {
                return res.send({ error: 'Error occurred while sending email to the seller. Please try to manually send an email.' })
            }
            else if (results.length > 0) {
                var message = {
                    from: 'bookswap@gmail.com',
                    to: results[0].email,
                    subject: 'BookSwap: A Book You Sent Has Been Flagged as Not Received',
                    text: results[0].title + ' has been flagged as not received by the buyer. Please login to book swap and update the status or contact the user directly.'
                }
                common.transport.sendMail(message)
            }
            res.send({ success: 'success' })
        })
    })
})

router.post('/updateStatus', (req, res, next) => {
    var updateTransaction = 'UPDATE Transactions SET statusId = ?, modified = ? WHERE id = ?'
    var transactionStatuses = 'INSERT INTO TransactionStatusDates (transactionId, statusId, date) VALUES (?, ?, ?)'
    var updateAvailable = 'UPDATE UserBooks SET available = 1 WHERE id = (SELECT userBookId FROM Transactions WHERE id = ?)'

    var formData = req.body

    // update transaction record status and modified date
    sql.pool.query(updateTransaction, [formData.statusId, today, formData.id],
        (err, results) => {
            if (err) {
                return res.send({ error: 'Error occurred when trying to update status. Please try again.' })
            }

            // add record to transaction status history
            sql.pool.query(transactionStatuses, [formData.id, formData.statusId, today],
                (err, results) => {
                    if (err) {
                        return res.send({ error: 'Error occured when trying to update status history.' })
                    }

                    // if status is cancelled or rejected, make available immediately
                    if (formData.statusId == 5 || formData.statusId == 6) {
                        sql.pool.query(updateAvailable, [formData.id], (err, results) => {
                            if (err) {
                                return res.send({ error: 'Error occurred when trying to make book available. Please contact support at bookswaphelpdesk@gmail.com' })
                            }

                            res.send({ success: 'success' })
                        })
                    }

                    res.send({ success: 'success' })
                })
        })
})

router.post('/close', (req, res, next) => {
    var getTransaction = 'SELECT t.requestorId AS buyer, ub.userId AS seller, t.buyerPoints, t.sellerPoints, t.rcvdOnTime, t.conditionMatched\
                            FROM Transactions t\
                                INNER JOIN UserBooks ub ON t.userBookId = ub.Id\
                            WHERE t.id = ?'
    var updateTransaction = 'UPDATE Transactions SET sellerPoints = ?, buyerPoints = ?, statusId = 8, lost = ? WHERE id = ?'
    var transactionStatuses = 'INSERT INTO TransactionStatusDates (transactionId, statusId, date) VALUES (?, 8, ?)'
    var updateUserPoints = 'UPDATE Users SET points = points + ? WHERE id = ?'
    var updateAvailable = 'UPDATE UserBooks SET available = ? WHERE id = (SELECT userBookId FROM Transactions WHERE id = ?)'
    var errorMessage = 'Error occurred when trying to close the transaction. Pleae try again.'

    var formData = req.body

    // if status on close is lost, make sure lost flag is set
    var lostFlag = req.body.statusId == 7 ? true : false;

    // set avialable based on status
    var available = req.body.statusId == 4 || req.body.statusId == 7 ? false : true;

    sql.pool.query(getTransaction, [formData.id], (err, results) => {
        if (err) {
            return res.send({ error: errorMessage })
        }

        var transaction = results[0]
        var sellerPointGain = transaction.sellerPoints
        var buyerPointLoss = transaction.buyerPoints

        // update point variables
        if (transaction.statusId == 4) {
            // if late and bad condition, complete loss
            if (transaction.rcvdOnTime == 0 && t.conditionMatched == 0) {
                sellerPointGain = 0
                buyerPointLoss = 0
            }
            // if late or bad condition, cut cost/gain in half
            else if (transaction.rcvdOnTime == 0 || t.conditionMatched == 0) {
                sellerPointGain = transaction.points / 2
                buyerPointLoss = transaction.points / 2
            }
        }
        // ir received or rejected, set to 0
        else if (transaction.statusId == 5 || transaction.statusId == 6) {
            sellerPointGain = 0
            buyerPointLoss = 0
        }
        // if lost, seller gets half points and it costs buyer nothing
        else if (transaction.statusId == 7) {
            sellerPointGain = transaction.points / 2
            buyerPointLoss = 0
        }

        // update transaction
        sql.pool.query(updateTransaction, [sellerPointGain, buyerPointLoss, lostFlag, formData.id], (err, resuts) => {
            if (err) {
                return res.send({ error: errorMessage })
            }

            // add transaction status record
            sql.pool.query(transactionStatuses, [formData.id, today], (err, results) => {
                if (err) {
                    return res.send({ error: errorMessage })
                }

                // update book availability
                sql.pool.query(updateAvailable, [available, formData.id], (err, results) => {
                    if (err) {
                        return res.send({ error: errorMessage })
                    }

                    // update seller points
                    sql.pool.query(updateUserPoints, [sellerPointGain, transaction.seller], (err, results) => {
                        if (err) {
                            return res.send({ error: errorMessage })
                        }

                        // update buyer points
                        sql.pool.query(updateUserPoints, [buyerPointLoss, transaction.buyer], (err, results) => {
                            if (err) {
                                return res.send({ error: errorMessage })
                            }
                            
                            res.send({ success: 'success' })
                        })
                    })
                })
            })
        })
    })
})

router.post('/survey/submit', (req, res, next) => {
    var errorMessage = 'Error occurred while saving survey. Please try again later.'
    var updateTransaction = 'UPDATE Transactions SET ? WHERE id = ?'
    var transactionStatuses = 'INSERT INTO TransactionStatusDates (transactionId, statusId, date) VALUES (?, 4, ?)'
    console.log(req.body)
    var data = {
        statusId: '4',
        rcvdOnTime: req.body.rcvdOnTime == '1' ? true : false,
        conditionMatched: req.body.conditionMatched == '1' ? true : false,
        rating: req.body.star,
        modified: today,
        lost: false
    }

    // update transaction and point cost
    sql.pool.query(updateTransaction, [data, req.body.id], (err, results) => {
        if (err) {
            return res.send({ error: errorMessage })
        }

        if (req.body.isNew == 'true') {
            // add to transaction status
            sql.pool.query(transactionStatuses, [req.body.id, today], (err, results) => {
                if (err) {
                    return res.send({ error: errorMessage })
                }

                req.flash('success', 'Thank you for submitting our swap survey!')
                res.send({ success: 'Success' })
            })
        }
        else
        {
            req.flash('success', 'Your survey has been updated! Remember, once the swap is closed you cannot update your survey')
            res.send({ success: 'Success' })
        }


    })
})

router.get('/survey/(:id)', common.isAuthenticated, (req, res, next) => {
    var getSurvey = 'SELECT t.rcvdOnTime, t.conditionMatched, t.rating, t.created, c.description as cond\
    FROM Transactions t\
    INNER JOIN UserBooks ub ON t.userBookId = ub.id\
    INNER JOIN Conditions c ON ub.conditionId = c.id\
    WHERE t.id = ?'
    console.log(req.params.id)
    sql.pool.query(getSurvey, [req.params.id], (err, results) => {
        if (err || results.length == 0) {
            return res.send({ error: 'Error occurred while getting survey' })
        }

        var data = {
            rcvdOnTime: results[0].rcvdOnTime ? 1 : 0,
            conditionMatched: results[0].conditionMatched ? 1 : 0,
            star: results[0].rating,
            created: results[0].created,
            condition: results[0].cond
        }

        res.send(data)
    })
})

router.get('/history/(:id)', (req, res, next) => {
    var data = { title: 'Swap History' }
    var getHistory = 'SELECT s.description AS status, tsd.date \
                        FROM TransactionStatusDates tsd \
                        INNER JOIN Statuses s ON tsd.statusId = s.id \
                        WHERE tsd.transactionId = ?'
    sql.pool.query(getHistory, [req.params.id], (err, results) => {
        res.send({ data: results })
    })
})

module.exports = router