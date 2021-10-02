const mongoose = require('mongoose');
const express = require('express');
const Loan = require('../models/loan');
const e = require('express');
/**
 * Data and methods for loan requests.
 */
module.exports = class LoanRequest {
  /**
   * 
   * @param {mongoose.Document} loan
   * @param {string} key 
   */
  constructor(loan, key) {
    this.loan = loan;
    this.key = key;
    this.isLender = !loan || !key || loan.lenderKey == key;
  }

  /**
   * @type {Array}
   */
  get records() {
    return this.loan.records;
  }
  set records(records) {
    this.loan.records = records;
  }
  /**
   * Posts a record to the records array.
   * @param {string} memo
   * @param {number} amount
   * @param {boolean} isLender
   * @param {Date | number} createdAt
   */
  post(memo, amount, isLender = this.isLender, createdAt = new Date()) {
    let record = {
      poster: (isLender) ? 'lender' : 'borrower',
      approved: isLender,
      memo, amount, createdAt
    };
    if (isLender) record.approvedOn = Date.now();
    this.records.push(record);
  }
  /**
   * Gets the loan requests permissions with this record.
   * @param {object} record 
   * @returns 
   */
  getRecordPermissions(record) {
    let isRecord = record && record.poster;
    return {
      canApprove: (isRecord && !record.approved) && (this.isLender && record.poster == 'borrower' || !this.isLender && record.poster == 'lender'),
      canDelete: isRecord && this.isLender
    }
  }

  /**
   * Processes the autopay.
   */
  async processAutopay() {
    const loan = this.loan;
    if (loan.autopay.period) {
      /** @type {Date} */
      let event = new Date(loan.autopay.lastEvent.getTime());
      event.setUTCHours(0, 0, 0, 0);

      let reclen = this.records.length; // Used for determaing if it should save.
      const period = loan.autopay.period;
      while (event.getTime() < Date.now()) {
        // Determain if autopay should occure.
        let push = false;
        if (period == 'DAILY') {
          event.setUTCDate(event.getUTCDate() + loan.autopay.value);
          push = event.getTime() < Date.now();
        }
        else if (period == 'WEEKLY') {
          event.setUTCDate(event.getUTCDate() + (((loan.autopay.value + 7 - event.getUTCDay()) % 7) || 7));
          push = event.getTime() < Date.now();
        }

        // Pushes the autopay.
        if (push) {
          loan.autopay.lastEvent = new Date(event.getTime());
          this.post('AUTOPAY', loan.autopay.amount, true, event.getTime());
        }
      }

      if (this.records.length != reclen) {
        return await this.save();
      }
    }
  }

  /**
   * Saves loan and returns new LoanRequest.
   */
  async save() {
    if (!this.loan) throw new Error('Cannot save invalid loan.');
    const loan = await this.loan.save();
    return new LoanRequest(loan, this.key);
  }
  /**
   * Converts this object for JSON processing.
   */
  toJSON() {
    // Convert to object.
    let obj = {
      isLender: this.isLender,
      ...this.loan.toJSON()
    };
    
    // Order records by time.
    obj.records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    obj.records.forEach(record => {
      record.permissions = this.getRecordPermissions(record);
    });

    // Remove unneeded data.
    if (this.key) {
      if (this.isLender) {
        obj.key = obj.lenderKey;
      }
      else {
        obj.key = obj.borrowerKey;
      }
      delete obj.lenderKey;
      delete obj.borrowerKey;
    }
    delete obj._id;
    delete obj.__v;
    delete obj.id;

    // Return
    return obj;
  }

  /**
   * Finds a loan by key.
   * @param {string} key
   * @returns {Promise<LoanRequest>}
   */
  static async find(key) {
    const loan = await Loan.findOne({
      $or: [
        { lenderKey: key },
        { borrowerKey: key }
      ]
    });

    if (loan) {
      const loanReq = new LoanRequest(loan, key);
      loanReq.processAutopay();
      return loanReq;
    }
    else return null;
  }
  /**
   * Tries to find a loan by key. If none, send error response.
   * @param {express.Response} res 
   * @param {string} key
   * @return {Promise<LoanRequest | undefined>}
   */
  static async tryFind(res, key) {
    const loanReq = await LoanRequest.find(key);
    if (loanReq) return loanReq;
    else res.send({ err: `Could not find loan with key: ${key}` });
  }
  
  /**
   * Creates a new loan and returns the loan request.
   * @returns {Promise<LoanRequest>}
   */
  static async create() {
    const loan = new Loan({
      lenderKey: await LoanRequest.genkey(),
      borrowerKey: await LoanRequest.genkey()
    });
    return new LoanRequest(await loan.save());
  }
  /**
   * Generates a unique loan key.
   * @returns {Promise<string>}
   */
  static async genkey() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Generate key.
    let key = '';
    for (let i = 0; i < 12; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if key is unique.
    if (await LoanRequest.find(key)) {
      return await LoanRequest.genkey();
    }
    else {
      return key;
    }
  }
}