const express = require('express');
const bodyParser = require('body-parser');
const routeConstants = require('./routes');

const app = express();

const walletSetupRoutes = require('./routes/wallet-setup');
const blockchainRoutes = require('./routes/blockchain');
const electionRoutes = require('./routes/election');
const walletRoutes = require('./routes/wallet');

const HTTP_PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

app.use(walletSetupRoutes);

app.use(walletRoutes);
app.use(electionRoutes);
app.use(blockchainRoutes);

// Listen for HTTP Connection
app.listen(HTTP_PORT, () => {
	console.log(`Server running at PORT: ${HTTP_PORT}`);
});

// Listen for P2P server connections
routeConstants.p2pServer.listen();