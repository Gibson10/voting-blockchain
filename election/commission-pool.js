const Vote = require('./vote');
const AppUtil = require('../app-util');
const ChainUtil = require('../chain-util');

class CommissionPool {
	constructor() {
		/* Constructor for the CommissionPool class */

		this.votes = [];
	}

	addVote(vote, voteSignature, keyHash, electionId, blockchain, commissionPool) {
		/* Add a vote to the CommissionPool */

		const newVote = new Vote(vote, voteSignature, keyHash, electionId);

		const hasVotedBefore = Vote.hasVotedBefore(blockchain, commissionPool, electionId, newVote.voter_link);

		if (hasVotedBefore) {
			return false;
		}

		this.votes.push({
			'vote': newVote
		});

		return newVote;
	}

	clear() {
		/* Clear all votes from the CommissionPool */

		this.votes = [];
	}

	validVotes() {
		/* Return all valid votes from the CommissionPool */

		let validVotes = [];

		for (let i = 0; i < this.votes.length; i++) {
			let isDuplicate = false;

			for (let j = 0; j < validVotes.length; j++) {
				if (validVotes[j].vote.keyHash == this.votes[i].vote.keyHash) {
					isDuplicate = true;
				}
			}

			if (!isDuplicate) validVotes.push(this.votes[i]);
		}

		return validVotes;
	}
}

module.exports = CommissionPool;