const { BlockChain, Transaction } = require('./BlockChain');
const bodyParser = require('body-parser');
const request = require('request-promise');


const port = process.argv[2];
const currentNodeUrl = process.argv[3];

console.log(process.argv);


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
    let transaction = new Transaction(req.body.amount, req.body.sender, req.body.recipient);
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

// 1）对已经在network中的节点发送自己的url
app.post('/register-and-broadcast-node', function (req, res) {

    const newNodeUrl = req.body.newNodeUrl;
    if (chain.networkNodes.indexOf(newNodeUrl) === -1) {
        chain.networkNodes.push(newNodeUrl);  // 先加到自己的列表中
    }

    let regNodesPromises = []
    chain.networkNodes.forEach(networkUrl => { // 向列表中其他节点发送
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

// 2)其他节点收到通知
app.post('/register-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(newNodeUrl);
    res.json({ note: 'New node registered successfully.' });
});

// 3)在新加的节点上调用
app.post('/register-nodes-bulk', function (req, res) {

});

app.listen(port, function () {
    console.log(`listening on port ${port}...`)
});


