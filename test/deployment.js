const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const factory = contract.fromArtifact('DeterministicContractFactory');
const { rlp, keccak256, ecrecover, pubToAddress, Address, bufferToHex, BN  } = require('ethereumjs-util');
var Tx = require("ethereumjs-tx").Transaction

describe('DeterministicContractFactory', async function () {
    const deploymentGas = 100000;
    const deploymentBytecode = factory.bytecode;

    const nonce = 0;
    const gasPrice = 10000000;
    const gasLimit = deploymentGas;
    const to = 0;
    const value = 0;
    const data = deploymentBytecode;
    const v = 27;
    const r = '2222222222222222222222222222222222222222222222222222222222222222';
    const s = '2222222222222222222222222222222222222222222222222222222222222222';

    const txData = {
        nonce: '0x00',
        gasPrice: web3.utils.toHex(10e8),
        gasLimit: web3.utils.toHex(deploymentGas),
        to: '0x0000000000000000000000000000000000000000',
        value: '0x00',
        data: deploymentBytecode,
        v: '0x1c',
        r: '0x2222222222222222222222222222222222222222222222222222222222222222',
        s: '0x2222222222222222222222222222222222222222222222222222222222222222'
    };

    const tx = new Tx(txData);

    const signedEncodedTransaction = tx.serialize();
    const signedEncodedTransactionHash = keccak256(signedEncodedTransaction);
    const pubKey = ecrecover(signedEncodedTransactionHash, v, Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));
    const signerAddress = pubToAddress(pubKey);
    const deterministicContractFactoryAddress = Address.generate(new Address(signerAddress), new BN(nonce));

    console.log('signerAddress', bufferToHex(signerAddress));
    console.log('deterministicContractFactoryAddress', bufferToHex(deterministicContractFactoryAddress.buf));

    const amount = web3.utils.toWei('10', 'ether');

    await web3.eth.sendTransaction({ from: accounts[0], to: bufferToHex(signerAddress), value: amount});

    console.log('balance', await web3.eth.getBalance(bufferToHex(signerAddress)));

    const res = await web3.eth.sendSignedTransaction(bufferToHex(signedEncodedTransaction, { from : bufferToHex(signerAddress) }));
    console.log('res', res);
});