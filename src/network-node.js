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


chain = new BlockChain(currentNodeUrl);

app.get('/', function (req, res) {
    res.send('Hello world');
})

app.get('/blockchain', function (req, res) {
    res.send(chain)
})


app.get('/mine', function (req, res) {
    const lastBlock = chain.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: chain.pendingTransactions,
        index: lastBlock['index'] + 1
    };
    const nonce = chain.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = chain.hashBlock(previousBlockHash, currentBlockData, nonce);
    const newBlock = chain.createNewBlock(nonce, previousBlockHash, blockHash);

    let requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { "newBlock": newBlock },
            json: true
        };

        requestPromises.push(request(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            const requestOptions = {
                uri: chain.currentNodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: chain.reward,
                    sender: "00",
                    recipient: currentNodeUrl
                },
                json: true
            };

            return request(requestOptions);
        })
        .then(data => {
            res.json({
                note: "New block mined & broadcast successfully",
                block: newBlock
            });
        },reason =>{
            console.log(reason);
        });

})

app.post('/receive-new-block', function (req, res) {
    const newBlock = req.body.newBlock;
    // 验证新块
    const lastBlock = chain.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
    console.log(correctHash, correctIndex);
    if (correctHash && correctIndex) {
        chain.chain.push(newBlock);
        chain.pendingTransactions = [];
        res.json({
            note: 'New block received and accepted',
            newBlock: newBlock
        });
    } else {
        res.json({
            note: 'New block rejected.',
            newBlock: newBlock
        })
    }
})

// node -----------------------------

// 1）对已经在network中的节点发送自己的url
app.post('/register-and-broadcast-node', function (req, res) {

    const newNodeUrl = req.body.newNodeUrl;
    if (newNodeUrl === chain.currentNodeUrl) {
        res.json('note: cannot add yourself');
        return;
    }
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
    }).catch(reason => {
        console.log(reason);
        res.json({ note: 'failed' }) // todo: 添加节点验证
    })
});

// 2)其他节点收到通知
app.post('/register-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = chain.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = chain.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) chain.networkNodes.push(newNodeUrl);
    res.json({ note: 'New node registered successfully.' });
});

// 3)在新加的节点上调用
app.post('/register-nodes-bulk', function (req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = chain.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = chain.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode) chain.networkNodes.push(networkNodeUrl);
    })
    res.json({ note: 'Bulk registration successful.' });
});


// ----------------------
app.post('/transaction/broadcast', function (req, res) {
    let trans = new Transaction(req.body.sender, req.body.recipient, req.body.amount);
    chain.addTransactionToPendingTransactions(trans);
    let requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: trans,
            json: true
        }
        requestPromises.push(request(requestOptions));
    })

    Promise.all(requestPromises).then(data => {
        res.json({ note: 'Transaction created and brocast successfully.' });
    })
})

app.post('/transaction', function (req, res) {
    console.log(req.body);
    const newTransaction = req.body;
    const blockIndex = chain.addTransactionToPendingTransactions(newTransaction);
    res.send(`Transaction will be added in block ${blockIndex} .`);
});


app.listen(port, function () {
    console.log(`listening on port ${port}...`)
});


