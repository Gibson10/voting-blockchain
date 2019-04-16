const ChainUtil = require('../chain-util');

const {
	DIFFICULTY,
	MINE_RATE
} = require('../config');

class Block {
	constructor(timestamp, lastHash, hash, data, nonce, difficulty) {
		/* Constructor for the Block class */

		this.timestamp = timestamp;
		this.lastHash = lastHash;
		this.hash = hash;
		this.data = data;
		this.nonce = nonce;
		this.difficulty = difficulty || DIFFICULTY;
	}

	static genesis() {
		/* Create genesis block */

		return new this('genesis time', '---', 'genesis hash', [], 0, DIFFICULTY);
	}

	static mineBlock(lastBlock, data) {
		/* Handle mining a new block */

		// Define beginning nonce value
		let nonce = 0;

		// Define timestamp variable
		let blockTimestamp;

		// Define hash variable
		let newBlockHash;

		// Define the starting difficulty
		let {
			difficulty
		} = lastBlock

		do {
			// Incerement the nonce value
			nonce++;

			// Define block timestamp
			blockTimestamp = Date.now();

			// Mutate the difficulty
			difficulty = this.adjustDifficulty(lastBlock, blockTimestamp);

			// Hash the new block
			newBlockHash = this.hash(blockTimestamp, lastBlock.hash, data, nonce, difficulty);
		} while (newBlockHash.substring(0, difficulty) !== '0'.repeat(difficulty));

		// Create new block
		return new this(blockTimestamp, lastBlock.hash, newBlockHash, data, nonce, difficulty);
	}

	static hash(timestamp, lastHash, data, nonce, difficulty) {
		/* Hash a block given it's data */

		return ChainUtil.hash(`${timestamp}${lastHash}${data}${nonce}${difficulty}`).toString();
	}

	static blockHash(block) {
		/* Hash a block, given it's block */

		// Get block meta-data
		const {
			timestamp,
			lastHash,
			data,
			nonce,
			difficulty
		} = block;

		return this.hash(timestamp, lastHash, data, nonce, difficulty);
	}

	static adjustDifficulty(lastBlock, currentTime) {
		/* Adjust the difficulty required to mine a block */

		let {
			difficulty
		} = lastBlock;
		difficulty = lastBlock.timestamp + MINE_RATE > currentTime ? difficulty + 1 : difficulty - 1;

		return difficulty;
	}
}

module.exports = Block;