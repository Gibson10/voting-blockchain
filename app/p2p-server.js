const Websocket = require('ws');

const P2P_PORT = process.env.P2P_PORT || 5000;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
const MESSAGE_TYPES = {
	chain: 'CHAIN',
	transaction: 'TRANSACTION',
	vote: 'VOTE',
	clear_transactions: 'CLEAR_TRANSACTIONS',
	clear_commission: 'CLEAR_COMMISSION'
}

class P2PServer {
	constructor(blockchain, transactionPool, commissionPool) {
		/* Constructor for the P2PServer class */

		this.blockchain = blockchain;
		this.transactionPool = transactionPool;
		this.commissionPool = commissionPool;
		this.sockets = [];
	}

	listen() {
		/* Handle setting up of parent peer server,
		 * and listening for peer node socket connections
		 */

		// Create parent peer server
		const server = new Websocket.Server({
			port: P2P_PORT
		});

		// Handle new socket connection
		server.on('connection', socket => this.connectSocket(socket));

		// Connect all peers in the network
		this.connectPeers();

		// Notify of active P2P Server
		console.log(`Listening for P2P connections on PORT : ${P2P_PORT}`);
	}

	connectSocket(socket) {
		/* Connect socket to P2P Server */

		// Add socket to sockets array
		this.sockets.push(socket);

		// Handle sending of data between sockets
		this.messageHandler(socket);

		// Send the socket's blockchain to it's peers
		this.sendChain(socket);

		console.log(`Socket connected. Connected : ${this.sockets.length + 1}`);
	}

	connectPeers() {
		/* Connect all peers in the P2P network to node */

		peers.forEach(peer => {
			// Connect each individual peer

			const peerSocket = new Websocket(peer);
			peerSocket.on('open', () => this.connectSocket(peerSocket));
		});
	}

	sendChain(socket) {
		/* Send data between sockets */

		socket.send(JSON.stringify({
			type: MESSAGE_TYPES.chain,
			transaction: this.blockchain.chain
		}));
	}

	sendTransaction(socket, transaction) {
		/* Send transaction between sockets */

		socket.send(JSON.stringify({
			type: MESSAGE_TYPES.transaction,
			transaction
		}));
	}

	sendVote(socket, vote, voteSignature, keyHash, electionId) {
		/* Send vote between sockets */

		socket.send(JSON.stringify({
			type: MESSAGE_TYPES.vote,
			vote,
			voteSignature,
			keyHash,
			electionId
		}));
	}

	messageHandler(socket) {
		/* Handle the sending of data between sockets */

		socket.on('message', message => {
			const data = JSON.parse(message);

			// Decipher what data is incoming
			switch (data.type) {
				case MESSAGE_TYPES.chain:
					// Possibly replace the node's chain with the incoming chain
					this.blockchain.replaceChain(data.transaction);
					break;
				case MESSAGE_TYPES.transaction:
					// Update or add the incoming transaction to transactionPool
					this.transactionPool.updateOrAddTransaction(data.transaction);
					break;
				case MESSAGE_TYPES.vote:
					// Update or add the incoming transaction to transactionPool
					this.commissionPool.addVote(data.vote, data.voteSignature, data.keyHash, data.electionId);
					break;
				case MESSAGE_TYPES.clear_transactions:
					// Clear transactions from the transactionPool
					this.transactionPool.clear();
					break;
				case MESSAGE_TYPES.clear_commission:
					// Clear transactions from the transactionPool
					this.commissionPool.clear();
					break;
			}

		});
	}

	syncChains() {
		/* Synchronize all chains in the P2P network */

		this.sockets.forEach(socket => {
			this.sendChain(socket);
		});
	}

	broadcastTransaction(transaction) {
		/* Broadcast transaction to all sockets in the P2P Server */

		this.sockets.forEach(socket => {
			this.sendTransaction(socket, transaction);
		});
	}

	broadcastVote(vote, voteSignature, keyHash, electionId) {
		/* Broadcast vote to all sockets in the P2P Server */

		this.sockets.forEach(socket => {
			this.sendVote(socket, vote, voteSignature, keyHash, electionId);
		});
	}

	broadcastClearTransactions() {
		/* Broadcast for all nodes to clear their transaction pools */

		this.sockets.forEach(socket => socket.send(JSON.stringify({
			type: MESSAGE_TYPES.clear_transactions
		})));
	}

	broadcastClearCommission() {
		/* Broadcast for all nodes to clear their commission pools */

		this.sockets.forEach(socket => socket.send(JSON.stringify({
			type: MESSAGE_TYPES.clear_commission
		})));
	}
}

module.exports = P2PServer;