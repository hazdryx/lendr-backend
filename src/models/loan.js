const mongoose = require('mongoose');

// Build initial schema.
const loanSchema = mongoose.Schema({
    lenderKey: {
        type: String,
        required: true
    },
    borrowerKey: {
        type: String,
        required: true
    },
    records: [{
        poster: {
            type: String,
            enum: ['lender', 'borrower', 'autopay'],
            required: true
        },
        approved: {
            type: Boolean,
            required: true
        },
        memo: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        approvedOn: Date,
    }],
    autopay: {
        lastEvent: {
            type: Date,
            default() {
                let val = new Date();
                val.setUTCHours(0, 0, 0, 0);
                return val;
            }
        },
        period: {
            type: String,
        },
        value: {
            type: Number,
            default: 0
        },
        amount: {
            type: Number,
            default: 0
        }
    }
}, {
    toJSON: { virtuals: true }
});

// Add 'total' virtual.
loanSchema.virtual('total').get(function() {
    let total = 0;
    this.records.forEach(record => {
        total += (record.approved) ? record.amount : 0;
    });
    return total;
});

// Export
module.exports = mongoose.model('Loan', loanSchema);