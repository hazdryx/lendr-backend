const express = require('express');
const mongoose = require('mongoose');
const LoanRequest = require('./LoanRequest');
const router = express.Router();

/**
 * Tries to find a record by id. If none, send error response.
 * @param {express.Response} res 
 * @param {LoanRequest} loanReq
 * @param {string | mongoose.ObjectId} id
 * @returns {object | undefined}
 */
function tryFindRecord(res, loanReq, id) {
  if (!loanReq) return;

  const record = loanReq.records.find(r => r._id.equals(id));
  if (record) return record;
  else res.send({ err: `Could not found record with ID of: ${id}` });
}

//
// LOAN ENDPOINTS
//

/**
 * Creates a new loan and returns the result.
 */
router.post('/loan/create', async (req, res) => res.send(await LoanRequest.create()));
/**
 * Gets the loan by key.
 */
router.get('/loan/:key', async (req, res) => {
  const loanReq = await LoanRequest.tryFind(res, req.params.key);
  if (loanReq) res.send(loanReq);
});

//
// RECORD ENDPOINTS
//

/**
 * Posts a new record by key.
 */
router.post('/loan/:key/record', async (req, res) => {
  try {
    const loanReq = await LoanRequest.tryFind(res, req.params.key);
    if (loanReq) {
      loanReq.post(req.body.memo, req.body.amount);
      res.send(await loanReq.save());
    }
  }
  catch (e) {
    res.status(400).send({ err: `Bad Request` });
  }
});
/**
 * Gets a record by id.
 */
router.get('/loan/:key/record/:id', async (req, res) => {
  const loanReq = await LoanRequest.tryFind(res, req.params.key);
  const record = await tryFindRecord(res, loanReq, req.params.id);

  if (record) res.send(record);
});
/**
 * Approves a record by id.
 */
 router.patch('/loan/:key/record/:id', async (req, res) => {
  const loanReq = await LoanRequest.tryFind(res, req.params.key);
  const record = await tryFindRecord(res, loanReq, req.params.id);
  if(record) {
    const perms = loanReq.getRecordPermissions(record);
    if (perms.canApprove) {
      record.approved = true;
      record.approvedOn = Date.now();
      res.send(await loanReq.save());
    }
    else res.send({ err: 'Insufficient permissions to approve this record.'});
  }
});
/**
 * Deletes a record by id.
 */
router.delete('/loan/:key/record/:id', async (req, res) => {
  const loanReq = await LoanRequest.tryFind(res, req.params.key);
  const record = await tryFindRecord(res, loanReq, req.params.id);
  if (record) {
    const perms = loanReq.getRecordPermissions(record);
    if (perms.canDelete) {
      loanReq.records = loanReq.records.filter(r => !r._id.equals(req.params.id));
      res.send(await loanReq.save());
    }
    else res.send({ err: 'Insufficient permissions to delete this record.' });
  }
});

// Export router
module.exports = router;