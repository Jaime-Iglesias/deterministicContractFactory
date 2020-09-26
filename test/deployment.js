const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const factory = contract.fromArtifact('DeterministicContractFactory');
const { rlp, keccak256, ecrecover, pubToAddress, Address, bufferToHex, BN, toChecksumAddress, generateAddress, toBuffer  } = require('ethereumjs-util');
var Tx = require("ethereumjs-tx").Transaction

describe('DeterministicContractFactory', async function () {
    const gasPrice = 100000000000;
    const deploymentGas = 999999;
    const deploymentBytecode = factory.bytecode;
    
    const rawTx = {
        nonce: 0,
        gasPrice: gasPrice,
        gasLimit: deploymentGas,
        value: 0,
        data: deploymentBytecode,
        v: 27,
        r: '0x2222222222222222222222222222222222222222222222222222222222222222',
        s: '0x2222222222222222222222222222222222222222222222222222222222222222'
    };

    const tx = new Tx(rawTx);
    const signerAddress = toChecksumAddress(bufferToHex(tx.getSenderAddress()));
    const signedTx = bufferToHex(tx.serialize());
    const deterministicContractFactoryAddress = toChecksumAddress(bufferToHex(generateAddress(tx.getSenderAddress(), toBuffer(0))));

    console.log('signerAddress', signerAddress);
    console.log('deterministicContractFactoryAddress', deterministicContractFactoryAddress);

    const amount = web3.utils.toWei('100', 'ether');

    await web3.eth.sendTransaction({ from: accounts[0], to: signerAddress, value: '100000000000000000' });

    console.log('balance', await web3.eth.getBalance(signerAddress));

    const res = await web3.eth.sendSignedTransaction(signedTx);
    console.log('deployed', res.contractAddress);
});