const sha256 = require('sha256');
const uuid = require('uuid/v1')

class Transaction {

    constructor(sender, recipient, amount) {
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.id = uuid().split('-').join('')
    }

}

class BlockChain {

    constructor(currentNodeUrl) {
        this.reward = 12.5;
        this.chain = [];
        this.pendingTransactions = [];
        this.currentNodeUrl = currentNodeUrl;
        this.networkNodes = [];
        this.createNewBlock(100, '0', '0');
    }

    addTransactionToPendingTransactions(transactionObj) {
        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()['index'] + 1; // 最后一个block的下一个
    }

    createNewBlock(nonce, previousBlockHash, hash) {

        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash
        }

        this.pendingTransactions = [];
        this.chain.push(newBlock);
        return newBlock;
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    hashBlock(previousBlockHash, currentBlockData, nonce) {
        const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = sha256(dataAsString);
        return hash;
    }

    proofOfWork(previousBlockHash, currentBlockData) {
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while (!this.validNonce(hash)) {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
            console.log(hash);
        }

        return nonce;
    }

    validNonce(hash) {
        // return hash.substring(0, 1) === '0';
        return hash.substring(0, 4) === '0000';
    }

    chainIsValid(blockchain) {

        const genesisBlock = blockchain[0];
        if (!genesisBlock['nonce'] === 100) return false;
        if (!genesisBlock['previousBlockHash'] === '0') return false;
        if (!genesisBlock['hash'] === '0') return false;
        if (!genesisBlock['transactions'].length === 0) return false;


        for (let i = 1; i < blockchain.length; i++) {
            const currentBlock = blockchain[i];
            const previousBlock = blockchain[i - 1];
            if (currentBlock['previousBlockHash'] !== previousBlock['hash']) return false;
            // hash data need index ?
            const blockHash = this.hashBlock(previousBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
            if (!this.validNonce(blockHash)) return false;
            console.log('previousBlockHash =>', previousBlock['hash']);
            console.log('currentBlockHash =>', currentBlock['hash']);
        }
        return true;
    }

    getBlock(blockHash) {
        for (const block of this.chain) {
            if (block.hash === blockHash)
                return block;
        }
        return null;
    }

    // 不会搜索pendding transactions
    getTransaction(transactionId) {
        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.id === transactionId)
                    return { trans, block };
            }
        }
    }

    getAddressData(address) {
        let addressTransactions = [];
        this.chain.forEach(block => {
            block.transactions.forEach(trans => {
                if (trans.sender === address || trans.recipient === address) {
                    addressTransactions.push(trans);
                }
            })
        })

        let balance = 0;
        addressTransactions.forEach(transaction => {
            if (transaction.recipient === address) balance += transaction.amount;
            else if (transaction.sender === address) balance -= transaction.amount;
        });

        return {
            addressTransactions: addressTransactions,
            addressBalance: balance
        };

    }

}

module.exports.BlockChain = BlockChain;
module.exports.Transaction = Transaction;