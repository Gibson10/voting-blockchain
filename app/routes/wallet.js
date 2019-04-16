const express = require('express');
const router = express.Router();

const Miner = require('../miner');
const routeConstants = require('./index');
const {
	VERIFIED,
	UNVERIFIED
} = require('../../app-constants');

// Get route to view all transactions
router.get('/transactions', (req, res) => {

	res.json(routeConstants.transactionPool.transactions);
});

// Get route to get wallet balance
router.post('/balance', (req, res) => {

	const walletInstance = routeConstants.walletSetup.reformatWallet(req.body.walletInstance);

	const balance = walletInstance.calculateBalance(routeConstants.blockchain);
	res.json({
		balance
	});
});

// Post route for a user to mine
router.post('/mine', (req, res) => {

	const wallet = req.body.walletInstance;
	const walletInstance = routeConstants.walletSetup.reformatWallet(wallet);

	routeConstants.walletSetup.hookWallet(walletInstance);
	const retrievedWallet = routeConstants.walletSetup.retrieveWallet(walletInstance);

	if (retrievedWallet) {

		const miner = new Miner(
			routeConstants.blockchain,
			routeConstants.transactionPool,
			routeConstants.commissionPool,
			retrievedWallet,
			routeConstants.p2pServer);

		const block = miner.mine();

		res.json(block);
	} else {
		res.json({
			'status': routeConstants.UNVERIFIED,
			'message': 'Oops! An error has occurred while mining the block.'
		});
	}
});

// Post route to add a new transaction and add it to the transactionPool
router.post('/transact', (req, res) => {

	const {
		walletInstance,
		recipient,
		amount
	} = req.body;

	const walletInst = routeConstants.walletSetup.reformatWallet(walletInstance);

	if (recipient && amount && walletInst && walletInstance) {
		const transaction = walletInst.createTransaction(recipient, amount, routeConstants.blockchain, routeConstants.transactionPool);
		routeConstants.p2pServer.broadcastTransaction(transaction);

		res.redirect('/transactions');
	} else {
		res.json({
			'status': routeConstants.UNVERIFIED,
			'message': 'Oops! An error has occurred while carrying out the transaction.'
		});
	}
});

module.exports = router;