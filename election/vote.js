const _ = require('lodash');
const Election = require('./index');
const AppUtil = require('../app-util');
const ChainUtil = require('../chain-util');
const Report = require('../app/routes/report');
const {
	ERROR,
	VERIFIED
} = require('../app-constants');

class Vote {
	constructor(vote, voteSignature, keyHash, electionId) {
		/* Constructor for the Vote class */

		this.id = ChainUtil.id();
		this.timeStamp = Date.now();

		if (vote && voteSignature && keyHash && electionId) {
			const voterLink = vote.voter_link;
			delete vote.voter_link;
			delete vote.election_id;

			this.vote = vote;
			this.signature = voteSignature;
			this.keyHash = keyHash;
			this.election_id = electionId;
			this.voter_link = voterLink;
		} else {
			this.vote = null;
		}
	}

	static verifyVoter(voterLink_u, blockchain) {
		/* Cast a new vote to the election if it is valid */

		const voterLink = voterLink_u.replace(/_/g, '/');

		const electionId = voterLink.substring(0, voterLink.indexOf('@'));
		const hashString = voterLink.substring(voterLink.indexOf('@') + 1);

		if (!electionId || !hashString) return Report.report('The voter link provided is invalid.', ERROR);

		let election = Election.findElection(electionId, blockchain);
		if (!election) return Report.report('The URL provided does not match to any election that you are a part of.', ERROR);

		const decryptedVotingData = AppUtil.decryptVotingData(hashString, electionId);
		if (!decryptedVotingData) return Report.report('The voter link provided is invalid.', ERROR);

		let electionDecryptedElectorate = [];
		election.election.electorate.forEach((voter, index) => {
			if (index > 0) {
				const voterEmail = AppUtil.decryptEmailAddress(voter[2], election.election.publicKey);
				electionDecryptedElectorate.push([
					voter[0], voter[1], voterEmail
				]);
			}
		});

		let isEligibleToVote = false;

		electionDecryptedElectorate.forEach(decryptedVoter => {
			if (_.isEqual(decryptedVotingData, decryptedVoter[0])) {
				isEligibleToVote = true;
			}
		});

		election.election.voter_link = voterLink_u;

		if (!isEligibleToVote) return Report.report('Sorry. You are not eligible to participate in this election.', ERROR);

		return election;
	}

	static hasVotedBefore(blockchain, commissionPool, electionId, voterLink) {
		/* Check whether a voter has already voted */

		// On Chain
		let voteBlocks = [];
		let hasVotedBefore = false;

		for (let i = 0; i < blockchain.chain.length; i++) {
			if (blockchain.chain[i].data[0] && blockchain.chain[i].data[0].vote) {
				voteBlocks.push(blockchain.chain[i].data[0]);
			}
		}

		for (let i = 0; i < voteBlocks.length; i++) {
			if (voteBlocks[i].vote.voter_link == voterLink) {
				hasVotedBefore = true;
			}
		}

		// On Commission Pool
		const validVotes = commissionPool.validVotes();

		validVotes.forEach(vote => {
			if (vote.vote.voter_link == voterLink) {
				hasVotedBefore = true;
			}
		});

		return hasVotedBefore;
	}

	static sign(dataHash, walletKeyPair) {
		/* Handle the signing of new votes */

		return walletKeyPair.sign(dataHash);
	}

	castVote(vote, commissionPool, walletKeyPair, walletPublicKey, electionId) {
		/* Cast a voter's vote in the election */

		const voteSignature = this.sign(ChainUtil.hash(JSON.stringify(vote.vote)), walletKeyPair);
		const keyHash = ChainUtil.hash(`${walletPublicKey}${electionId}${vote.vote}`)
			.toString();

		const verifiedVote = commissionPool.addVote(vote, voteSignature, keyHash, electionId);

		return verifiedVote;
	}
}

module.exports = Vote;