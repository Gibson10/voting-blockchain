const express = require('express');
const router = express.Router();

const Miner = require('../miner');
const Wallet = require('../../wallet');
const ChainUtil = require('../../chain-util');
const Vote = require('../../election/vote');
const routeConstants = require('./index');

/******************** GET ***********************/

// Get route to view all unverified votes
router.get('/commission', (req, res) => {

	res.json(routeConstants.commissionPool.validVotes());
});

// Get route for finding an election
router.get('/election/:id', (req, res) => {

	let election = null;

	if (req.params.id) {
		election = routeConstants.Election.findElection(req.params.id, routeConstants.blockchain);
	}

	election ? res.json(
		election
	) : res.json({
		'status': routeConstants.UNVERIFIED,
		'message': 'Oops! An error has occurred while finding the election.'
	});
});

// Get route for getting election balance
router.get('/election/balance/:id', (req, res) => {

	let election = null;
	let balance = null;

	if (req.params.id) {
		election = routeConstants.Election.findElection(req.params.id, routeConstants.blockchain);
	}

	if (election) {
		balance = routeConstants.Election.calculateBalance(routeConstants.blockchain, election);
	}

	balance ? res.json({
		balance
	}) : res.json({
		'status': routeConstants.UNVERIFIED,
		'message': 'Oops! An error has occurred while finding election balance.'
	});
});

// Get route for getting current election results
router.get('/election/results/:id', (req, res) => {

	let election = null;
	let election_results = [];
	let election_results_u = [];
	let merged_result_object = {};

	if (req.params.id) {
		election = routeConstants.Election.findElection(req.params.id, routeConstants.blockchain);
	}

	if (election) {
		election_results_u = routeConstants.Election.getResults(routeConstants.blockchain, election);
		if (election_results_u && election_results_u.length > 0) {
			election_results_u.forEach(result => {
				if (Array.isArray(result)) {
					result.forEach(resInstance => {
						election_results.push(resInstance);
					});
				} else {
					election_results.push(result);
				}
			});
		}
	}

	if (election_results) {
		let vetted_contender_positions = [];
		let vetted_contenders = [];
		let contender_positions = [];
		let contenders = [];

		merged_result_object.totalVotes = election_results.length;

		election_results.forEach(result => {
			Object.keys(result)
				.forEach((key, index) => {

					if (!contender_positions.includes(key)) {
						contender_positions.push(key);

						vetted_contender_positions.push({
							[`${key}`]: 1
						});
					} else {
						const incremented_val = vetted_contender_positions[index][`${key}`] + 1;
						vetted_contender_positions[index] = {
							[`${key}`]: incremented_val
						}
					}
				});

			Object.values(result)
				.forEach((value, index) => {

					if (!contenders.includes(value)) {
						contenders.push(value);
						vetted_contenders.push({
							[`${value}`]: 1
						});
					} else {
						const incremented_val = vetted_contenders[index][`${value}`] + 1;
						vetted_contenders[index] = {
							[`${value}`]: incremented_val
						}
					}
				});
		});

		merged_result_object.vetted_contender_positions = vetted_contender_positions;
		merged_result_object.vetted_contenders = vetted_contenders;
	}

	merged_result_object ? res.json({
		merged_result_object
	}) : res.json({
		'status': routeConstants.UNVERIFIED,
		'message': 'Oops! An error has occurred while finding election results.'
	});
});

/******************** POST ***********************/

// Post route to create an election
router.post('/create-election', (req, res) => {

	const {
		privateKey,
		contenders,
		electorate,
		election_name,
		seed_amount,
		timeStampStart,
		timeStampEnd
	} = req.body;

	let electionInfo = 'null';

	const walletInsto = routeConstants.walletSetup.retrieveWalletPrivate(privateKey);
	const walletInst = routeConstants.walletSetup.reformatWallet(walletInsto);

	if (walletInst) {
		const miner = new Miner(
			routeConstants.blockchain,
			routeConstants.transactionPool,
			routeConstants.commissionPool,
			walletInst,
			routeConstants.p2pServer);

		if (election_name && seed_amount && timeStampStart && timeStampEnd && contenders && electorate && miner) {
			electionInfo = walletInst.createElection(election_name, seed_amount, timeStampStart, timeStampEnd, electorate,
				contenders, miner);

			electionInfo ? res.json({
				'status': routeConstants.VERIFIED,
				'message': 'Election has been created successfuly.'
			}) : res.json({
				'status': routeConstants.UNVERIFIED,
				'message': 'Oops! An error occurred while creating the election.'
			});
		} else {
			res.json({
				'status': routeConstants.UNVERIFIED,
				'message': 'Oops! An error has occurred while designing the election.'
			});
		}

	} else {
		res.json({
			'status': routeConstants.UNVERIFIED,
			'message': 'Oops! The wallet instance provided is invalid.'
		});
	}
});

// Post route for voter verification
router.post('/voter/verify', (req, res) => {

	const {
		voter_link
	} = req.body;

	let election = 'null';

	if (voter_link) {
		// election = Wallet.verifyVoter(voter_link, routeConstants.blockchain);
		election = Vote.verifyVoter(voter_link, routeConstants.blockchain);

		if (!election) {
			res.json({
				'status': routeConstants.UNVERIFIED
			});
		}

		const electionData = election.election;

		election ? res.json(
			electionData
		) : res.json({
			'status': routeConstants.UNVERIFIED
		});
	} else {
		res.json({
			'status': routeConstants.UNVERIFIED
		});
	}
});

// Post route for casting a vote
router.post('/voter/cast', (req, res) => {

	const {
		vote,
		voter_link,
		election_id
	} = req.body;

	if (voter_link && vote) {

		const voterLink_u = voter_link.replace(/_/g, '/');

		let veriVote = vote;
		veriVote.voter_link = voterLink_u;
		veriVote.election_id = election_id;

		const wallet = routeConstants.walletSetup.createCompleteWallet();
		const signature = Vote.sign(ChainUtil.hash(JSON.stringify(vote)), wallet.keyPair);
		const hash = ChainUtil.hash(`${vote}${voter_link}`)
			.toString();
		const verifiedVote = routeConstants.commissionPool.addVote(veriVote, signature, hash, election_id, routeConstants.blockchain, routeConstants.commissionPool);

		if (verifiedVote) routeConstants.p2pServer.broadcastVote(veriVote, signature, hash, election_id);

		if (!verifiedVote) {
			res.json({
				'status': routeConstants.UNVERIFIED,
				'message': 'You can only vote once.'
			});
		} else {
			res.json(
				verifiedVote
			);
		}
	}
});

module.exports = router;