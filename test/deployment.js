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

    const txData = {
        nonce: 0,
        gasPrice: web3.utils.toHex(0),
        gasLimit: web3.utils.toHex(deploymentGas),
        to: '0x0000000000000000000000000000000000000000',
        value: web3.utils.toHex(0),
        data: deploymentBytecode,
        v: 27,
        r: r,
        s: s
    };

    const tx = new Tx(txData);

    const signedEncodedTransaction = tx.serialize();
    const signedEncodedTransactionHash = keccak256(signedEncodedTransaction);
    const pubKey = ecrecover(signedEncodedTransactionHash, v, Buffer.from(r), Buffer.from(s));
    const signerAddress = pubToAddress(pubKey);
    const deterministicContractFactoryAddress = Address.generate(new Address(signerAddress), new BN(0));

    console.log('signerAddress', bufferToHex(signerAddress));
    console.log('deterministicContractFactoryAddress', bufferToHex(deterministicContractFactoryAddress.buf));

    const amount = web3.utils.toWei('10', 'ether');

    await web3.eth.sendTransaction({ from: accounts[0], to: bufferToHex(signerAddress), value: amount});

    console.log('balance', await web3.eth.getBalance(bufferToHex(signerAddress)));

    console.log('accounts', accounts)
    const res = await web3.eth.sendSignedTransaction(bufferToHex(signedEncodedTransaction));
    console.log('res', res);
});