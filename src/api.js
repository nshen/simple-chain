const BlockChain = require('./BlockChain');
const bodyParser = require('body-parser');
const request = require('request-promise');
let express = require('express');
let app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


chain = new BlockChain()

app.get('/', function (req, res) {
    res.send('Hello world');
})

app.get('/blockchain', function (req, res) {
    res.send(chain)
})

app.post('/transaction', function (req, res) {
    console.log(req.body);
    let transaction = chain.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    let blockIndex = chain.addTransactionToPendingTransactions(transaction);
    res.send(`Transaction will be added in block ${blockIndex} .`);
});

app.get('/mine', function (req, res) {
    let lastBlock = chain.getLastBlock();
    let previousBlockHash = lastBlock['hash'];
    let currentBlockData = {
        transaction: chain.pendingTransactions,
        index: lastBlock['index'] + 1
    }

    let nonce = chain.proofOfWork(previousBlockHash, currentBlockData);
    let blockHash = chain.hashBlock(previousBlockHash, currentBlockData, nonce);
    let newBlock = chain.createNewBlock(nonce, previousBlockHash, blockHash); h
    res.json({
        note: 'New block mined successfully',
        block: newBlock
    });

})

app.post('/register-and-broadcast-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (chain.networkNodes.indexOf(newNodeUrl) == -1) {
        chain.networkNodes.push(newNodeUrl)
    }

    let regNodesPromises = []
    chain.networkNodes.forEach(networkUrl => {
        const requestOptions = {
            url: networkUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl },
            json: true
        }
        regNodesPromises.push(request(requestOptions));
    });
    Promise.all(regNodesPromises).then(data => {
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/register-nodes-bulk',
            method: 'POST',
            body: { allNetworkNodes: [...chain.networkNodes, chain.currentNodeUrl] },
            json: true
        };

        return request(bulkRegisterOptions);
    }).then(data => {
        res.json({ note: 'New node registered with network successfully.' })
    })
});
app.post('/register-node', function (req, res) {

});
app.post('/register-nodes-bulk', function (req, res) {

});
app.listen(3000, function () {
    console.log('listening on port 3000...')
});


