const express = require('express')
const router = express.Router()
const sql = require('../dbcon.js')
const common = require('../common')

var today = new Date()

router.get('/', common.isAuthenticated, (req, res, next) => {
    var data = { title: 'My Swaps' }

    var outgoing = 'SELECT t.id, u.email, u.firstName, u.lastName, b.title, b.author, t.created, t.modified, t.statusId, s.description AS status, t.pointCost \
                FROM Transactions t\
                    INNER JOIN Users u ON t.requestorId = u.id\
                    INNER JOIN Statuses s ON t.statusId = s.id\
                    INNER JOIN UserBooks ub ON t.userBookId = ub.id\
                    INNER JOIN Books b ON ub.bookId = b.id\
                WHERE ub.userId = ? AND t.statusId <> 8'

    var incoming = 'SELECT t.id, u.email, u.firstName, u.lastName, b.title, b.author, t.created, t.modified, t.statusId, s.description AS status, t.pointCost\
                FROM Transactions t\
                    INNER JOIN Statuses s ON t.statusId = s.Id\
                    INNER JOIN UserBooks ub ON t.userBookId = ub.id\
                    INNER JOIN Users u ON ub.userId = u.id\
                    INNER JOIN Books b ON ub.bookId = b.id\
                WHERE t.requestorId = ? AND t.statusId <> 8'

    var history = 'SELECT t.id, u.id AS userId, u.firstName, u.lastName, "Outgoing" AS type, b.title, b.author, t.created, t.modified, s.description AS status, t.pointReward AS points\
                FROM Transactions t\
                    INNER JOIN Users u ON t.requestorId = u.id\
                    INNER JOIN Statuses s ON t.statusId = s.id\
                    INNER JOIN UserBooks ub ON t.userBookId = ub.id\
                    INNER JOIN Books b ON ub.bookId = b.id\
                WHERE ub.userId = ?\
               UNION\
               SELECT t.id, u.id as userId, u.firstName, u.lastName, "Incoming" AS type, b.title, b.author, t.created, t.modified, s.description AS status, t.pointCost AS points\
                FROM Transactions t\
                    INNER JOIN Statuses s ON t.statusId = s.id\
                    INNER JOIN UserBooks ub ON t.userBookId = ub.id\
                    INNER JOIN Users u ON ub.userId = u.id\
                    INNER JOIN Books b ON ub.bookId = b.id\
                WHERE t.requestorId = ?'

    sql.pool.query(outgoing, [req.session.userId], (err, results) => {
        if (err) {
            req.flash('error', err);
            res.render('myswaps', data);
        }
        else if (results.length > 0) {
            data.outgoing = results;
            data.outgoingCount = results.length;
        }

        sql.pool.query(incoming, [req.session.userId], (err, results) => {
            if (err) {
                req.flash('error', err)
                res.render('myswaps', data)
            }
            else if (results.length > 0) {
                data.incoming = results;
                data.incomingCount = results.length;
            }

            sql.pool.query(history, [req.session.userId, req.session.userId], (err, results) => {
                if (err) {
                    req.flash('error', err)
                    res.render('myswaps', data)
                }
                else if (results.length > 0) {
                    data.history = results
                    data.historyCount = results.length
                    res.render('myswaps', data)
                }
            })
        })
    })
})

router.post('/updateStatus', (req, res, next) => {
    var formData = req.body

    var updateTransaction = 'UPDATE Transactions SET statusId = ?, modified = ? WHERE id = ?'
    var transactionStatuses = 'INSERT INTO TransactionStatusDates (transactionId, statusId, date) VALUES (?, ?, ?)'

    // update transaction record status and modified date
    sql.pool.query(updateTransaction, [formData.statusId, today, formData.id],
        (err, results) => {
            if (err) {
                res.send({ error: 'Error occurred when trying to update status. Please try again.' })
            }

            // add record to transaction status history
            sql.pool.query(transactionStatuses, [formData.id, formData.statusId, today],
                (err, results) => {
                    if (err) {
                        res.send({ error: 'Error occured when trying to update status history.' })
                    }

                    res.send({ success: 'success' })
                })
        })
})

router.post('/close', (req, res, next) => {
    var formData = req.body

    var getTransaction = 'SELECT t.requestorId AS requestor, ub.userId AS seller, t.pointCost AS points, t.rcvdOnTime, t.conditionMatched\
                            FROM Transactions t\
                                INNER JOIN UserBooks ub ON t.userBookId = ub.Id\
                            WHERE t.id = ?'
    var updateTransaction = 'UPDATE Transactions SET pointCost = ?, statusId = 8 WHERE id = ?'
    var transactionStatuses = 'INSERT INTO TransactionStatusDates (transactionId, statusId, date) VALUES (?, 8, ?)'
    var increaseUserPoints = 'UPDATE Users SET points = points + ? WHERE id = ?'
    var updateAvailable = 'UPDATE UserBooks SET available = available ^ 1 WHERE id = (SELECT userBookId FROM Transactions WHERE id = ?)'
    var errorMessage = 'Error occurred when trying to close the transaction. Pleae try again.'

    sql.pool.query(getTransaction, [formData.id], (err, results) => {
        if (err) {
            res.send({ error: errorMessage })
        }

        var transaction = results[0]

        // if status is rejected, cancelled or lost -> 
        if (formData.statusId == 5 || formData.statusId == 6 || formData.statusId == 7) {
            // update transaction
            sql.pool.query(updateTransaction, [0, formData.id], (err, results) => {
                if (err) {
                    res.send({ error: errorMessage })
                }

                // add transaction status record
                sql.pool.query(transactionStatuses, [formData.id, today], (err, results) => {
                    if (err) {
                        res.send({ error: errorMessage })
                    }

                    // give requestor back their points
                    // TODO add pending points adjustment
                    sql.pool.query(increaseUserPoints, [transaction.points, transaction.requestor], (err, results) => {
                        if (err) {
                            res.send({ error: errorMessage })
                        }
                    })

                    //TODO handle pending point adjustment for seller - available points already correct
                })

                // if the status was rejected or cancelled, set book to be available again
                if (formData.statusId != 7) {
                    sql.pool.query(updateAvailable, [formData.id], (err, results) => {
                        if (err) {
                            res.send({ error: 'Error occured when updating book availability ' })
                        }

                    })
                }

                res.send({ success: 'success' })
            })
        }

        // if status is received ->
        else if (formData.statusId == 4) {
            // update transaction
            sql.pool.query(updateTransaction, [transaction.points, formData.id], (err, results) => {
                if (err) {
                    res.send({ error: errorMessage })
                }

                // add transaction status record
                sql.pool.query(transactionStatuses, [formData.id, today], (err, results) => {
                    if (err) {
                        res.send({ error: errorMessage })
                    }

                    // give seller their points
                    // TODO also update their pending points
                    sql.pool.query(updateUserPoints, [transaction.points, transaction.seller], (err, results) => {
                        if (err) {
                            res.send({ error: errorMessage })
                        }
                    })

                    // TODO update requestors pending points - available points is already correct
                    res.send({ success: 'success' })
                })
            })
        }
    })
})

router.post('/survey', (req, res, next) => {
    var data = {
        statusId: '4',
        rcvdOnTime: req.body.rcvdOnTime,
        conditionMatched: req.body.conditionMatched,
        rating: req.body.star,
        modified: today
    }

    var errorMessage = 'Error occurred while saving survey. Please try again later.'
    var updateTransaction = 'UPDATE Transactions SET ? WHERE id = ?; UPDATE Transactions SET pointCost = \
                CASE WHEN rcvdOnTime = 0 AND conditionMatched = 0 THEN 0\
                     WHEN rcvdOnTime = 0 OR conditionMatched = 0 THEN 1\
                     ELSE pointCost END\
                WHERE id = ?'

    var transactionStatuses = 'INSERT INTO TransactionStatusDates (transactionId, statusId, date) VALUES (?, 4, ?)'

    // update transaction and point cost
    sql.pool.query(updateTransaction, [data, req.body.id, req.body.id], (err, results) => {
        if (err) {
            res.send({ error: errorMessage })
        }

        // add to transaction status
        sql.pool.query(transactionStatuses, [req.body.id, today], (err, results) => {
            if (err) {
                res.send({ error: errorMessage })
            }

            req.flash('success', 'Thank you for submitting our swap survey!')
            res.send({ success: 'success' })
        })
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