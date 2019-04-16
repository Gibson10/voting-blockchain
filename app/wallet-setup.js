const Wallet = require('../wallet');

class WalletSetup {
	constructor() {
		/* Constructor for the WalletSetup class */

		this.wallets = [];
		this.voterLinks = [];
		this.votes = [];
		this.lobna = 0;
		this.keabetswe = 0;
		this.brain = 0;
		this.henry = 0;
		this.tago = 0;
		this.mbarek = 0;
		this.kenza = 0;
		this.nixon = 0;
		this.daisy = 0;
		this.eriife = 0;
		this.omrane = 0;
		this.david = 0;
		this.bupe = 0;
		this.omobolaji = 0;
		this.omar = 0;
		this.ugo = 0;
		this.yacine = 0;
		this.ziad = 0;
		this.aidah = 0;
		this.tiyinoluwa = 0;
		this.cameron = 0;
	}

	addVoterLink(voterLink) {

		this.voterLinks.push(voterLink);
	}

	retrieveMass(voterLink) {

		const hasVoted = false;

		for (let i = 0; i < this.voterLinks.length; i++) {
			if (this.voterLinks[i] == voterLink) {
				hasVoted = true;
			}
		}

		return hasVoted;
	}

	addVote(vote) {

		this.votes.push(vote);
	}

	retrieveVotes() {

		return this.votes;
	}

	retrieveVoterLinks() {

		return this.voterLinks;
	}

	createWallet() {
		/* Create a new wallet instance */

		const newWallet = new Wallet();

		if (newWallet) {
			this.wallets.push(JSON.parse(JSON.stringify(newWallet)));
		}

		const formattedWallet = {
			balance: newWallet.balance,
			publicKey: newWallet.publicKey,
			privateKey: newWallet.privateKey
		}

		return formattedWallet;
	}

	createCompleteWallet() {
		/* Create a new wallet instance */

		const newWallet = new Wallet();

		if (newWallet) {
			this.wallets.push(JSON.parse(JSON.stringify(newWallet)));
		}

		return newWallet;
	}

	reformatWallet(walletInstance) {
		/* Reformat wallet instance */

		let newWalletInstance = new Wallet();

		newWalletInstance.balance = walletInstance.balance;
		newWalletInstance.publicKey = walletInstance.publicKey;
		newWalletInstance.privateKey = walletInstance.privateKey;

		return newWalletInstance;
	}

	hookWallet(walletInstance) {
		/* Hook wallet instance to class */

		let toHookWallet = new Wallet();

		toHookWallet.balance = walletInstance.balance;
		toHookWallet.publicKey = walletInstance.publicKey;
		toHookWallet.retrieveWalletPrivate = walletInstance.privateKey;

		let isAlreadyHooked = false;

		for (let i = 0; i < this.wallets.length; i++) {
			if (this.wallets[i].publicKey == toHookWallet.publicKey) {
				isAlreadyHooked = true;
			}
		}

		if (!isAlreadyHooked) {
			this.wallets.push(toHookWallet);
		}
	}

	unhookWallet(toUnhookWallet) {
		/* Unhook wallet from wallet instance */

		const walletInstances = this.wallets.filter(wallet => {
			return wallet.publicKey != toUnhookWallet.publicKey
		});

		this.wallets = walletInstances;
	}

	retrieveWallet(toRetrieveWallet) {
		/* Retrieve wallet from class instance */

		for (let i = 0; i < this.wallets.length; i++) {
			if (this.wallets[i].publicKey == toRetrieveWallet.publicKey) {
				return this.wallets[i];
			}
		}

		return false;
	}

	retrieveWalletPrivate(privateKey) {
		/* Retrieve wallet from private key instance */

		for (let i = 0; i < this.wallets.length; i++) {
			if (this.wallets[i].privateKey == privateKey) {
				return this.wallets[i];
			}
		}

		return false;
	}
}

module.exports = WalletSetup;