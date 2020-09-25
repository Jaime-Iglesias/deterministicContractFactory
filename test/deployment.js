const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const factory = contract.fromArtifact('DeterministicContractFactory');
const { rlp, keccak256, ecrecover, pubToAddress, Address, bufferToHex, BN  } = require('ethereumjs-util');
var Tx = require("ethereumjs-tx").Transaction

describe('DeterministicContractFactory', async function () {
    const deploymentGas = 100000;
    const deploymentBytecode = factory.bytecode;

    const v = 27;
    const r = '0x2222222222222222222222222222222222222222222222222222222222222222';
    const s = '0x2222222222222222222222222222222222222222222222222222222222222222';

    const unsignedTransaction = {
        nonce: 0,
        gasPrice: 0,
        gasLimit: 1000000,
        to: '0x0000000000000000000000000000000000000000',
        value: 0,
        data: deploymentBytecode
    };

    const signedTransaction = {
        nonce: 0,
        gasPrice: 0,
        gasLimit: 1000000,
        to: '0x0000000000000000000000000000000000000000',
        value: 0,
        data: deploymentBytecode,
        v: v,
        r: r,
        s: s
    };

    const unsignedTx = new Tx(unsignedTransaction);
    const signedTx = new Tx(signedTransaction);

    const unsignedEncodedTransaction = unsignedTx.serialize();
    const signedEncodedTransaction = signedTx.serialize();
    const unsignedEncodedTransactionHash = keccak256(unsignedEncodedTransaction);
    const pubKey = ecrecover(unsignedEncodedTransactionHash, v, Buffer.from(signedTransaction.r), Buffer.from(signedTransaction.s), 0);
    const signerAddress = pubToAddress(pubKey);
    const deterministicContractFactoryAddress = Address.generate(new Address(signerAddress), new BN(0));

    console.log('signerAddress', bufferToHex(signerAddress));
    console.log('deterministicContractFactoryAddress', bufferToHex(deterministicContractFactoryAddress.buf));

    const amount = web3.utils.toWei('10', 'ether');

    await web3.eth.sendTransaction({ from: accounts[0], to: bufferToHex(signerAddress), value: amount});

    console.log('balance', await web3.eth.getBalance(bufferToHex(signerAddress)));

    const res = await web3.eth.sendSignedTransaction(bufferToHex(signedEncodedTransaction));
    console.log('res', res);
});