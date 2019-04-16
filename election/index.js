const fs = require('fs');
const csv = require('fast-csv');
const Papa = require('papaparse');
const request = require('request');
const AppUtil = require('../app-util');
const ChainUtil = require('../chain-util');
const Report = require('../app/routes/report');
const Transaction = require('../wallet/transaction');
const {
	ERROR
} = require('../app-constants');

class Election {
	constructor(creator_publicKey, election_name, seedAmount, start_time, end_time, electorate, contenders) {
		/* Constructor for the Election class */

		this.id = ChainUtil.id();
		this.creatorKey = creator_publicKey;
		this.timeCreated = Date.now();
		this.election_name = election_name;
		this.seed_amount = seedAmount;
		this.start_time = start_time;
		this.end_time = end_time;
		this.electorate = electorate;
		this.contenders = contenders;
		this.keyPair = ChainUtil.genKeyPair();
		this.publicKey = this.keyPair.getPublic()
			.encode('hex');
	}

	static validateElectorateCSV(electorateCSV, contendersCSV, creator_publicKey, election_name, seed_amount, timeStampStart, timeStampEnd, miner) {
		/* Validate an electorate csv file */

		// Variable to store electorate emails
		let electorateEmails = [];

		// Create electorateFile variable container
		let electorateFile = [];

		// Read the electorate csv file
		csv.fromStream(request(electorateCSV))
			.on("data", function(electorateData) {
				electorateFile.push(electorateData);
			})
			.on("end", function() {

				// Check whether the electorate csv header is valid
				const electorateDataHeader = electorateFile[0];
				if (!electorateDataHeader) return Report.report('Electoral csv file column titles are incorrect.', ERROR);

				if (electorateDataHeader.length != 3) {
					return Report.report('Electoral csv file column length is incorrect.', ERROR);
				} else if (electorateDataHeader[0].toLocaleLowerCase() != 'name') {
					return Report.report('Electoral csv file first column is not named \'name\'.', ERROR);
				} else if (electorateDataHeader[1].toLowerCase() != 'electoral id') {
					return Report.report('Electoral csv file second column is not named \'electoral id\'.', ERROR);
				} else if (electorateDataHeader[2].toLowerCase() != 'email address') {
					return Report.report('Electoral csv file second column is not named \'email address\'.', ERROR);
				}

				// Check whether the electorate csv is missing values
				for (let i = 0; i < electorateFile.length; i++) {
					if (electorateFile[i].length != 3 || electorateFile[i][0] === '' || electorateFile[i][1] === '' || electorateFile[i][2] === '') {
						return Report.report(`Row ${i + 1} is missing a value - Electorate.`, ERROR);
					}
				}

				// Check whether emails in the electorate csv are valid
				for (let i = 0; i < electorateFile.length; i++) {
					const validationCheck = Election.validateEmailAddress(electorateFile[i][2]);

					if (!validationCheck) {
						if (electorateFile[i][2] && electorateFile[i][2].toLowerCase() != 'email address') return Report.report(`The email address \'${electorateFile[i][2]}\' at row ${i + 1} is invalid - Electorate.`, ERROR);
					} else {
						electorateEmails.push(electorateFile[i][2]);
					}
				}

				// Validate the contendersCSV
				Election.validateContendersCSV(contendersCSV, creator_publicKey, election_name, seed_amount, timeStampStart, timeStampEnd, miner, electorateFile);
			});
	}

	static validateContendersCSV(contendersCSV, creator_publicKey, election_name, seed_amount, timeStampStart, timeStampEnd, miner, electorateFile) {
		/* Validate a contenders csv file */

		// Variable to store contender emails
		let contenderEmails = [];

		// Variable to store contenders file
		const contendersFile = [];

		// Read the contenders csv file
		csv.fromStream(request(contendersCSV))
			.on("data", function(contenderData) {
				contendersFile.push(contenderData);
			})
			.on("end", function() {

				// Check whether the contenders csv header is valid
				const contendersDataHeader = contendersFile[0];
				if (!contendersDataHeader) return Report.report('Contenders csv file column titles are incorrect.', ERROR);

				if (contendersDataHeader.length != 3) {
					return Report.report('Contenders csv file column length is incorrect.', ERROR);
				} else if (contendersDataHeader[0].toLocaleLowerCase() != 'name') {
					return Report.report('Contenders csv file first column is not named \'name\'.', ERROR);
				} else if (contendersDataHeader[1].toLowerCase() != 'position') {
					return Report.report('Contenders csv file second column is not named \'position\'.', ERROR);
				} else if (contendersDataHeader[2].toLowerCase() != 'email address') {
					return Report.report('Contenders csv file third column is not named \'email address\'.', ERROR);
				}

				// Check whether the contenders csv is missing values
				for (let i = 0; i < contendersFile.length; i++) {
					if (contendersFile[i].length != 3 || contendersFile[i][0] === '' || contendersFile[i][1] === '' || contendersFile[i][2] === '') {
						return Report.report(`Row ${i + 1} is missing a value - Contenders.`, ERROR);
					}
				}

				// Check whether emails in the contenders csv are valid
				for (let i = 0; i < contendersFile.length; i++) {
					const validationCheck = Election.validateEmailAddress(contendersFile[i][2]);

					if (!validationCheck) {
						if (contendersFile[i][2] && contendersFile[i][2].toLowerCase() != 'email address') return Report.report(`The email address \'${contendersFile[i][2]}\' at row ${i + 1} is invalid - Contenders.`, ERROR);
					} else {
						contenderEmails.push(contendersFile[i][2]);
					}
				}

				// Create a new election instance
				const election = new Election(creator_publicKey, election_name, seed_amount, timeStampStart, timeStampEnd, electorateFile, contendersFile);

				// Add election to the blockchain and add seed balance
				const minifiedElection = Election.minifyElection(election);
				miner.syncElectionAndSeed(election.publicKey, seed_amount, minifiedElection.minifiedElection);
			});
	}

	static validateEmailAddress(email) {
		/* Validate whether email address is correctly formatted */

		const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return emailRegex.test(String(email)
			.toLowerCase());
	}

	static minifyElection(election) {
		/* Minify election for addition to the blockchain */

		let emailInfo = [];

		// Email both the electorate and the contenders.
		election.electorate.forEach((voter, index) => {
			if (index > 0) {
				const encryptedVotingData = AppUtil.encryptVotingData(voter[0], election.id);
				let text = `${election.id}@${encryptedVotingData}`;
				text = text.replace(/\//g, '_');
				const message = `https://aon-wallet.herokuapp.com/${text}`;
				console.log(message);
				const voterEmail = voter[2];
				emailInfo.push({
					voterEmail,
					message
				});
				AppUtil.sendEmail(voter[2], message);
			}
		});

		// Encrypt the email addresses (s))
		this.encryptCSVEmailAddresses(election.electorate, election.publicKey);
		this.encryptCSVEmailAddresses(election.contenders, election.publicKey);

		const minifiedElection = {
			election: {
				id: election.id,
				creatorKey: election.creatorKey,
				timeCreated: election.timeCreated,
				electionName: election.election_name,
				seedAmount: election.seed_amount,
				startTime: election.start_time,
				endTime: election.end_time,
				electorate: election.electorate,
				contenders: election.contenders,
				publicKey: election.publicKey
			}
		}

		return {
			minifiedElection,
			emailInfo
		};
	}

	static encryptCSVEmailAddresses(data, publicKey) {
		/* Encrypt electorate and contender email addresses */

		data.forEach((voter, index) => {
			if (index > 0) {
				const encryptedEmail = AppUtil.encryptEmailAddress(voter[2], publicKey);
				voter[2] = encryptedEmail;
			}
		});
	}

	static findElection(electionId, blockchain) {
		/* Find an election on the blockchain */

		let elections = [];

		for (let i = 0; i < blockchain.chain.length; i++) {
			if (blockchain.chain[i].data.election) {
				elections.push(blockchain.chain[i].data);
			}
		}

		for (let i = 0; i < elections.length; i++) {
			if (elections[i].election.id === electionId) {
				return elections[i];
			}
		}

		return Report.report('No election matches the ID provided.', ERROR);
	}

	static calculateBalance(blockchain, election) {
		/* Calculate remaining balance from an election */

		let balance = 0;
		let electionTransactions = [];
		let electionRewardCredited = 0;

		for (let i = 0; i < blockchain.chain.length; i++) {
			if (blockchain.chain[i].data[0] && blockchain.chain[i].data[0].vote) {
				blockchain.chain[i].data.forEach(transaction => {
					electionTransactions.push(transaction);
				});
			}
		}

		for (let i = 0; i < electionTransactions.length; i++) {
			if (electionTransactions[i].outputs && electionTransactions[i].outputs[0]) {

				let amount = null;

				electionTransactions[i].outputs.forEach(output => {
					if (output.amount) {
						amount = output.amount;
					}

					if (election.election.id == output.election_id && amount) {
						electionRewardCredited += amount;
					}
				});
			}
		}

		balance = election.election.seedAmount - electionRewardCredited;

		return balance;
	}

	static getResults(blockchain, election) {
		/* Get the current results for a particular election */

		let electionTransactions = [];
		let electionVotes = [];

		for (let i = 0; i < blockchain.chain.length; i++) {
			if (blockchain.chain[i].data[0] && blockchain.chain[i].data[0].vote) {
				blockchain.chain[i].data.forEach(transaction => {
					electionTransactions.push(transaction);
				});
			}
		}

		for (let i = 0; i < electionTransactions.length; i++) {
			if (electionTransactions[i].vote) {

				if (electionTransactions[i].vote.election_id == election.election.id) {
					electionVotes.push(electionTransactions[i].vote.vote);
				}
			}
		}

		return electionVotes;
	}
}

module.exports = Election;