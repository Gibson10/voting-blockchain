const express = require('express');
const router = express.Router();

const routeConstants = require('./index');

// All blocks get route
router.get('/chain', (req, res) => {

	// Return blockchain as json response
	res.json(routeConstants.blockchain.chain);
});

//Wild card get route
router.get('*', (req, res) => {

	// Rediect to /chain
	res.redirect('/chain');
});

// Wild card post route
router.post('*', (req, res) => {

	// Rediect to /chain
	res.redirect('/chain');
});

module.exports = router;