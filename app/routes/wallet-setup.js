const express = require('express');
const router = express.Router();

const routeConstants = require('./index');

/* Create a new wallet instance */
router.get('/create-wallet', (req, res) => {

	let wallet = routeConstants.walletSetup.createWallet();

	if (wallet) {
		routeConstants.miner.wallet = wallet;
	} else {
		res.json({
			'status': routeConstants.UNVERIFIED,
			'message': 'Oops! Unable to create new wallet.'
		});
	}

	res.json(
		wallet
	);
});

/* Unhook a wallet instance */
router.post('/unhook-wallet', (req, res) => {

	const walletToUnhook = req.body.wallet;

	routeConstants.walletSetup.unhookWallet(walletToUnhook);

	const walletInstance = routeConstants.walletSetup.retrieveWallet(walletToUnhook);

	walletInstance ? res.json({
		'status': routeConstants.UNVERIFIED,
		'message': 'Oops! An error occurred during wallet unhooking.'
	}) : res.json({
		'status': routeConstants.VERIFIED,
		'message': 'User wallet unhooked successfuly.'
	});
});

/* Hook a wallet instance */
router.post('/hook-wallet', (req, res) => {

	const wallet = req.body.wallet;
	routeConstants.walletSetup.hookWallet(wallet);

	const walletInstance = routeConstants.walletSetup.retrieveWallet(wallet);

	walletInstance ? res.json(
		walletInstance
	) : res.json({
		'status': routeConstants.UNVERIFIED,
		'message': 'Oops! An error occurred during wallet hooking.'
	});
});


module.exports = router;