const Wallet = require('../wallet');
const Election = require('../election');
const walletSetup = require('./wallet-setup');
const Transaction = require('../wallet/transaction');
const {
	MINING_REWARD,
	HALF_BLOCK_RATE
} = require('../config');

class Miner {
	constructor(blockchain, transactionPool, commissionPool, wallet, p2pServer) {
		/* Constructor for the Miner class */

		this.blockchain = blockchain;
		this.transactionPool = transactionPool;
		this.commissionPool = commissionPool;
		this.wallet = wallet;
		this.p2pServer = p2pServer;
	}

	mine() {
		/* Mine transactions from the transactionPool */

		let block = null;
		let mineChoice = null;
		const validTransactions = this.transactionPool.validTransactions();
		const validVotes = this.commissionPool.validVotes();

		if (validTransactions.length > 0 && validVotes.length > 0) {
			mineChoice = Math.floor(Math.random() * 2) + 1;
		} else if (validTransactions.length > 0) {
			mineChoice = 1;
		} else if (validVotes.length > 0) {
			mineChoice = 2;
		} else {
			return {
				'mine status': 'No transactions to be mined'
			};
		}

		if (mineChoice === 1) {

			let miningReward = Math.floor(this.blockchain.chain.length / HALF_BLOCK_RATE) + 1;
			miningReward = MINING_REWARD / miningReward;

			validTransactions.push(Transaction.rewardTransaction(this.wallet, Wallet.blockchainWallet(), miningReward));
			block = this.blockchain.addBlock(validTransactions);
			this.p2pServer.syncChains();
			this.transactionPool.clear();
			this.p2pServer.broadcastClearTransactions();
		}

		if (mineChoice === 2) {

			validVotes.forEach(vote => {
				const election = Election.findElection(vote.vote.election_id, this.blockchain);

				const miningReward = election.election.seedAmount / election.election.electorate.length;

				if (election && miningReward) {
					let miningTransaction = Transaction.rewardTransaction(this.wallet, Wallet.blockchainWallet(), miningReward);
					miningTransaction.outputs.push({
						'election_id': election.election.id
					});
					validVotes.push(miningTransaction);
				}
			});

			block = this.blockchain.addBlock(validVotes);
			this.p2pServer.syncChains();
			this.commissionPool.clear();
			this.p2pServer.broadcastClearCommission();
		}

		return block;
	}

	syncElectionAndSeed(electionPublicKey, amount, election) {
		/* Add seed money to election and add newly created election to next position on chain */

		const seedElectionTransaction = this.wallet.createTransaction(electionPublicKey, amount, this.blockchain, this.transactionPool);
		this.p2pServer.broadcastTransaction(seedElectionTransaction);

		const electionBlock = this.blockchain.addBlock(election);
		this.p2pServer.syncChains();

		return electionBlock;
	}
}

module.exports = Miner;