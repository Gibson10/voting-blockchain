const _ = require('lodash');
const AppUtil = require('../app-util');
const Election = require('../election');
const Vote = require('../election/vote');
const ChainUtil = require('../chain-util');
const Transaction = require('./transaction');
const Report = require('../app/routes/report');
const {
	INITIAL_BALANCE,
	INITIAL_BALANCE_ADMIN
} = require('../config');
const {
	ERROR
} = require('../app-constants')

class Wallet {
	constructor() {
		/* Constructor for the wallet class */

		this.balance = INITIAL_BALANCE;
		this.keyPair = ChainUtil.genKeyPair();
		this.privateKey = this.keyPair.getPrivate();
		this.publicKey = this.keyPair.getPublic()
			.encode('hex');
	}

	sign(dataHash) {
		/* Handle the signing of new transactions */

		return this.keyPair.sign(dataHash);
	}

	createTransaction(recipient, amount, blockchain, transactionPool) {
		/* Handle creating of new transactions */

		this.balance = this.calculateBalance(blockchain);

		if (amount > this.balance) {
			return Report.report(`Amount: ${amount} exceeds current balance: ${this.balance}`, ERROR);
		}

		let transaction = transactionPool.existingTransaction(this.publicKey);

		if (transaction) {
			transaction.update(this, recipient, amount)
		} else {
			transaction = Transaction.newTransaction(this, recipient, amount);
			transactionPool.updateOrAddTransaction(transaction);
		}

		return transaction;
	}

	createElection(election_name, seed_amount, timeStampStart, timeStampEnd, electorate,
		contenders, miner) {
		/* Create an election tied to this wallet instance */

		// // Check whether wallet has >= seedAmount
		if (this.balance < seed_amount) return Report.report('You do not have enough balance to seed the election.', ERROR);

		if (electorate && contenders) {

			// Create the election
			const electorateData = Election.validateElectorateCSV(electorate,
				contenders,
				this.publicKey,
				election_name,
				seed_amount,
				timeStampStart,
				timeStampEnd,
				miner);

			return true;
		}
	}

	static verifyVoter(voterLink, blockchain) {
		/* Verify a voter in an election */

		if (!voterLink) return Report.report('No voter link has been provided.', ERROR);

		// const election = Vote.verifyVoter(voterLink, blockchain);

		return 'election';
	}

	castVote(voterLink, blockchain, election, voteCast, commissionPool, walletKeyPair, walletPublicKey) {
		/* Cast a vote in an election */

		const vote = new Vote();
		vote.vote = voteCast;
		const verifiedElection = Vote.verifyVoter(voterLink, blockchain, walletPublicKey);
		let verifiedVote = null;

		if (verifiedElection) {
			if (!election && !election.status) return Report.report('Sorry. The parameters provided are incorrect.', ERROR);
			if (!_.isEqual(verifiedElection.election, election)) return Report.report('Sorry. We were unable to verify your eligibility to vote.', ERROR);

			verifiedVote = vote.castVote(vote, commissionPool, walletKeyPair, walletPublicKey, election.election.id);
		}

		return verifiedVote;
	}

	calculateBalance(blockchain) {
		/* Calculate the balance for a wallet instance */

		let balance = this.balance;
		let transactions = [];

		for (let i = 0; i < blockchain.chain.length; i++) {
			if (!blockchain.chain[i].data.election && blockchain.chain[i].data[0] && !blockchain.chain[i].data[0].vote) {
				blockchain.chain[i].data.forEach(transaction => {
					transactions.push(transaction);
				});
			}
		}

		let walletInputTransactions = [];
		if (transactions.length > 0) {
			walletInputTransactions = transactions.filter(transaction => transaction.input.address === this.publicKey);
		}

		let startTime = 0;

		if (walletInputTransactions.length > 0) {
			const recentInputTransaction = walletInputTransactions.reduce((prev, current) => prev.input.timestamp > current.input.timestamp ? prev : current);

			balance = recentInputTransaction.outputs.find(output => output.address === this.publicKey)
				.amount;
			startTime = recentInputTransaction.input.timestamp;
		}

		transactions.forEach(transaction => {
			if (transaction.input.timestamp > startTime) {
				transaction.outputs.find(output => {
					if (output.address === this.publicKey) {
						balance += output.amount;
					}
				});
			}
		});

		for (let i = 0; i < blockchain.chain.length; i++) {
			if (blockchain.chain[i].data[0] && blockchain.chain[i].data[0].vote) {
				blockchain.chain[i].data.forEach(data => {
					if (data.outputs) {
						let amount = null;
						let address = null;
						data.outputs.forEach(output => {
							if (output.amount) {
								amount = output.amount;
							}

							if (output.address) {
								address = output.address;
							}
						});

						if (address && amount && address == this.publicKey) {
							balance += amount;
						}
					}
				});
			}
		}

		return balance;
	}

	static blockchainWallet() {
		/* Create a blockchain wallet */

		const blockchainWallet = new this;
		blockchainWallet.balance = INITIAL_BALANCE_ADMIN;
		blockchainWallet.address = 'blockchain-wallet';

		return blockchainWallet;
	}
}

module.exports = Wallet;