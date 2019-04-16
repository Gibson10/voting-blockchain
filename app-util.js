const CryptoJS = require('crypto-js');
const nodemailer = require('nodemailer');
const mailer = require('nodemailer-promise');
const {
	APP_EMAIL,
	APP_EMAIL_PASSWORD
} = require('./app-keys');

class AppUtil {
	static sendEmail(receiverEmail, messager) {
		/* Handle basic functionality - sending of an email */

		const sendEmail = mailer.config({
			service: "Gmail",
			auth: {
				user: APP_EMAIL,
				pass: APP_EMAIL_PASSWORD
			}
		});

		const message = {
			from: '"Blockchain Electoral System" <blockchainelections@gmail.com>',
			bcc: receiverEmail,
			subject: 'Email Verification',
			text: messager,
			// html: ''
		};

		sendEmail(message)
			.then(function(info) {
				console.log(info)
				// Do nothing
			})
			.catch(function(err) {
				console.log("error occurred is seding email");
				// Do nothing
			});

		return true;
	}

	static encryptEmailAddress(email, encryptionId) {
		/* Encrypt individual email address */

		const secretKey = this.getSecretKey(encryptionId);

		const encryptedEmail = CryptoJS.AES.encrypt(email, secretKey);

		return encryptedEmail.toString();
	}

	static decryptEmailAddress(hash, encryptionId) {
		/* Decrypt individual email address */

		const secretKey = this.getSecretKey(encryptionId);

		const decryptedEmail = CryptoJS.AES.decrypt(hash.toString(), secretKey);
		const decryptedData = decryptedEmail.toString(CryptoJS.enc.Utf8);
		return decryptedData.toString();
	}

	static encryptVotingData(votingData, encryptionId) {
		/* Encrypt voting data */

		const secretKey = this.getSecretKey(encryptionId);

		const encryptedVotingData = CryptoJS.AES.encrypt(JSON.stringify(votingData), secretKey);

		return encryptedVotingData.toString();
	}

	static decryptVotingData(hash, encryptionId) {
		/* Encrypt voting data */

		const secretKey = this.getSecretKey(encryptionId);

		const decryptedVotingData = CryptoJS.AES.decrypt(hash.toString(), secretKey);

		const decryptedData = decryptedVotingData.toString(CryptoJS.enc.Utf8);

		return JSON.parse(decryptedData);
	}

	static getSecretKey(encryptionId) {
		/* Get secret key from a public key */

		const secretKey = [];
		encryptionId.split('')
			.forEach((char, index) => {
				if (index % 2 === 0) {
					secretKey.push(char);
				}
			});

		return secretKey.toString();
	}
}

module.exports = AppUtil;