const Miner = require('../miner');
const Wallet = require('../../wallet');
const Election = require('../../election');
const P2PServer = require('../p2p-server');
const Blockchain = require('../../blockchain');
const WalletSetup = require('../wallet-setup');
const WalletInstances = require('./wallet-instances');
const TransactionPool = require('../../wallet/transaction-pool');
const CommissionPool = require('../../election/commission-pool');
const {
	VERIFIED,
	UNVERIFIED,
	INCOMPLETE_DATA
} = require('../../app-constants');

const wallet = new Wallet();
const walletSetup = new WalletSetup();
const blockchain = new Blockchain();
const commissionPool = new CommissionPool();
const transactionPool = new TransactionPool();
const walletInstances = new WalletInstances();

const p2pServer = new P2PServer(blockchain, transactionPool, commissionPool);
const miner = new Miner(blockchain, transactionPool, commissionPool, wallet, p2pServer);

module.exports = {
	Election,

	VERIFIED,
	UNVERIFIED,
	INCOMPLETE_DATA,

	wallet,
	blockchain,
	walletSetup,
	commissionPool,
	transactionPool,
	walletInstances,

	p2pServer,
	miner
}