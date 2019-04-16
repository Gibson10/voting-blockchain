const Report = require('../app/routes/report');
const Transaction = require('../wallet/transaction');
const {
	ERROR
} = require('../app-constants');

class TransactionPool {
	constructor() {
		// Constructor for the TransactionPool class

		this.transactions = [];
	}

	updateOrAddTransaction(transaction) {
		// Update or add new transaction to transaction pool

		let transactionWithId = this.transactions.find(transaction_x => transaction_x.id === transaction.id);

		if (transactionWithId) {
			this.transactions[this.transactions.indexOf(transactionWithId)] = transaction;
		} else {
			this.transactions.push(transaction);
		}
	}

	existingTransaction(address) {
		/* Check whether transaction exists */

		return this.transactions.find(transaction_x => transaction_x.input.address === address);
	}

	validTransactions() {
		/* Return valid transactions from the transactionPool */

		return this.transactions.filter(transaction_x => {
			const outputTotal = transaction_x.outputs.reduce((total, output) => {
				return total + output.amount;
			}, 0);

			if (transaction_x.input.amount !== outputTotal) {
				return Report.report(`Invalid transaction from ${transaction_x.input.address}.`, ERROR);
			}

			return transaction_x;
		});
	}

	clear() {
		/* Clear the transaction pool from all transactions */

		this.transactions = [];
	}
}

module.exports = TransactionPool;