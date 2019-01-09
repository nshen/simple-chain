const BlockChain = require('./BlockChain');

let coin = new BlockChain();
console.log(coin)
// coin.createNewBlock(2389, 'OIUOEREDHKHKD', '78s97d4x6dsf');
// coin.addTransactionToPendingTransactions(coin.createNewTransaction(100, 'ALEXHT845SJ5TKCJ2', 'JENN5BG5DF6HT8NG9'));
// coin.createNewBlock(548764, 'AKMC875E6S1RS9', 'WPLS214R7T6SJ3G2');

// coin.addTransactionToPendingTransactions(coin.createNewTransaction(50, 'ALEXHT845SJ5TKCJ2', 'JENN5BG5DF6HT8NG9'));
// coin.addTransactionToPendingTransactions(coin.createNewTransaction(300, 'ALEXHT845SJ5TKCJ2', 'JENN5BG5DF6HT8NG9'));
// coin.addTransactionToPendingTransactions(coin.createNewTransaction(200, 'ALEXHT845SJ5TKCJ2', 'JENN5BG5DF6HT8NG9'));
// coin.createNewBlock(548764, 'AKMC875E6S1RS9', 'WPLS214R7T6SJ3G2');

// console.log(coin);

// const previousBlockchain = 'OIUOEREDHKHKD'
// const currentBlockData = [{amount:101,sender:'fdjkfdlsfj',recipient:'12121fdsfsd'}]

// console.log(coin.proofOfWork(previousBlockchain,currentBlockData))