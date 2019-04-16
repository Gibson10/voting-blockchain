const axios = require('axios');
const {
	API_SERVICE_URL
} = require('../../app-keys');

class Report {
	static report(report, weight) {
		/* Report a status update to the API Service */

		const reportUpdate = async () => {
			try {
				return await axios.post(`${API_SERVICE_URL}/report`, {
					report,
					weight
				});
			} catch (error) {
				// Do nothing
			}
		}

		const sendReport = async () => {
			const reportInfo = await reportUpdate();
		}

		sendReport();
	}
}

module.exports = Report;