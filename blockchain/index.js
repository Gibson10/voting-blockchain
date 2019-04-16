const Block = require('./block');

class Blockchain {
	constructor() {
		/* Constructor for the blockchain class */

		this.chain = [Block.genesis()];
	}

	addBlock(data) {
		/* Add a block to the blockchain */

		// Mine the new block
		const lastBlock = this.chain[this.chain.length - 1];
		const newBlock = Block.mineBlock(lastBlock, data);

		// Add the new block to the chain
		this.chain.push(newBlock);

		return newBlock;
	}

	isValidChain(chain) {
		/* Check the validity of an incoming chain */

		// Ensure that first block in incoming chain is genesis block
		if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

		// Ensure that last block has matches current block's last hash
		// and hash generated is valid
		for (let i = 1; i < chain.length; i++) {
			const currentBlock = chain[i];
			const lastBlock = chain[i - 1];

			if (lastBlock.hash !== currentBlock.lastHash) return false;
			if (Block.blockHash(currentBlock) !== currentBlock.hash) return false;
		}

		return true;
	}

	replaceChain(chain) {
		/* Replace current chain with incoming chain */

		// Ensure incoming chain is longer than current chain
		if (chain.length <= this.chain.length) {
			return;
		} else if (!this.isValidChain(chain)) {
			return;
		}

		// Replace chain
		this.chain = chain;

		return chain;
	}
}

module.exports = Blockchain;