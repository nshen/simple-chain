const sha256 = require('sha256');

class Transaction{

    constructor(sender,recipient,amount){
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
    }

}


class BlockChain {

    constructor(currentNodeUrl) {
        this.chain = [];
        this.pendingTransactions = [];
        this.currentNodeUrl = currentNodeUrl;
        this.networkNodes = [];
        this.createNewBlock(100,'0','0');
    }

    addTransactionToPendingTransactions(transactionObj) {
        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()['index'] + 1;
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
        while (hash.substring(0, 4) !== '0000') {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
            console.log(hash);
        }

        return nonce;

    }



}

module.exports.BlockChain = BlockChain;
module.exports.Transaction = Transaction;