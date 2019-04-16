const ChainUtil = require('../chain-util');
const Report = require('../app/routes/report');
const {
	ERROR
} = require('../app-constants');

class Transaction {
	constructor() {
		/* Constructor for the Transaction class */

		this.id = ChainUtil.id();
		this.input = null;
		this.outputs = [];
	}

	update(senderWallet, recipient, amount) {
		/* Update previously created transactions
		 * where the sender and recipient are similar
		 */

		const senderOutput = this.outputs.find(output => output.address === senderWallet.publicKey);

		// Check if amount to be transacted is available in sender's wallet
		if (amount > senderOutput.amount) return Report.report(`Amount : ${amount} exceeds balance.`, ERROR);

		senderOutput.amount = senderOutput.amount - amount;
		this.outputs.push({
			amount,
			address: recipient
		});

		// Sign transaction
		Transaction.signTransaction(this, senderWallet);

		return this;
	}

	static transactionWithOutputs(senderWallet, outputs) {
		/* Generate transaction with outputs */

		const transaction = new this();

		transaction.outputs.push(...outputs);

		// Sign transaction
		Transaction.signTransaction(transaction, senderWallet);

		return transaction;
	}

	static newTransaction(senderWallet, recipient, amount) {
		/* Create new transaction instance */

		// Check if amount to be transacted is available in sender's wallet
		if (amount > senderWallet.balance) return Report.report(`Amount : ${amount} exceeds balance.`, ERROR);

		return Transaction.transactionWithOutputs(senderWallet, [{
				amount: senderWallet.balance - amount,
				address: senderWallet.publicKey
			},
			{
				amount,
				address: recipient
			}
		]);
	}

	static rewardTransaction(minerWallet, blockchainWallet, miningReward) {
		/* Create a miner reward transaction */

		return Transaction.transactionWithOutputs(blockchainWallet, [{
			amount: miningReward,
			address: minerWallet.publicKey
		}]);
	}

	static signTransaction(transaction, senderWallet) {
		/* Sign a new incoming transaction */

		transaction.input = {
			timestamp: Date.now(),
			address: senderWallet.publicKey,
			amount: senderWallet.balance,
			signature: senderWallet.sign(ChainUtil.hash(transaction.outputs))
		}
	}

	static verifyTransaction(transaction) {
		/* Verify transaction */

		return ChainUtil.verifySignature(
			transaction.input.address,
			transaction.input.signature,
			ChainUtil.hash(transaction.outputs)
		);
	}
}

module.exports = Transaction;