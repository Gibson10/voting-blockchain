class WalletInstances {
	constructor() {
		/* Constructor for the WalletInstances class */

		this.wallets = [];
	}

	addWallet(walletInstance) {
		/* Add wallet instance to class */

		let isExisting = false;

		this.wallets.forEach(wallet => {
			if (wallet.publicKey == walletInstance.publicKey) {
				isExisting = true;
			}
		});

		if (!isExisting) {
			this.wallets.push(walletInstance);
		}
	}

	removeWallet(walletInstance) {
		/* Remove wallet instance from class */

		const walletInstances = this.wallets.filter(wallet => {
			return wallet.publicKey != walletInstance.publicKey;
		});

		this.wallets = walletInstances;
	}

	retrieveWallet(walletInstance) {
		/* Retrieve wallet from class */

		for (let i = 0; i < this.wallets.length; i++) {
			if (this.wallets[i].publicKey == walletInstance.publicKey) {
				return this.wallets[i];
			}
		}

		return false;
	}
}

module.exports = WalletInstances;