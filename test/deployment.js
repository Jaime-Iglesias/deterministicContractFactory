const Factory = artifacts.require('DeterministicContractFactory');
const ERC1820Registry = artifacts.require('ERC1820Registry');

const { bufferToHex, toChecksumAddress, generateAddress, toBuffer, keccak256  } = require('ethereumjs-util');
var Tx = require("ethereumjs-tx").Transaction

const { expect } = require('chai');

contract('DeterministicContractFactory', function (accounts) {
    const gasPrice = 100000000000;
    const deploymentGas = 999999;
    const deploymentBytecode = Factory.bytecode;
    
    const rawTx = {
        nonce: 0,
        gasPrice: gasPrice,
        gasLimit: deploymentGas,
        value: 0,
        data: deploymentBytecode,
        v: 27,
        r: '0x222222222222222222222222222222222222222222222222beefbeefbeefbeef',
        s: '0x222222222222222222222222222222222222222222222222beefbeefbeefbeef'
    };

    const tx = new Tx(rawTx);
    const signerAddress = toChecksumAddress(bufferToHex(tx.getSenderAddress()));
    const signedTx = bufferToHex(tx.serialize());
    const deterministicContractFactoryAddress = toChecksumAddress(bufferToHex(generateAddress(tx.getSenderAddress(), toBuffer(0))));

    console.log('signerAddress', signerAddress);
    console.log('deterministicContractFactoryAddress', deterministicContractFactoryAddress);

    it('deploys', async function () {
        await web3.eth.sendTransaction({ from: accounts[0], to: signerAddress, value: '100000000000000000' });
    
        //console.log('balance', await web3.eth.getBalance(signerAddress));
    
        const res = await web3.eth.sendSignedTransaction(signedTx);
        console.log('deployed factory address', res.contractAddress);
    
        const factoryContract = await Factory.at(deterministicContractFactoryAddress);
    
        const magic = Buffer.from('Clearmatics.com', 'utf8');
        const salt = bufferToHex(keccak256(magic));
    
        await factoryContract.deploy(salt, ERC1820Registry.bytecode, { from : accounts[0] });
        const ERC1820RegistryAddress = await factoryContract.computeAddress(salt, ERC1820Registry.bytecode, { from : accounts[0] });

        // check that the registry was deployed
        const registry = await ERC1820Registry.at(ERC1820RegistryAddress);
        const manager = await registry.getManager(accounts[0]);

        expect(manager).to.be.equal(accounts[0]);

        console.log('ERC1820RegistryAddress', ERC1820RegistryAddress)
    });
});