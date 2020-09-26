# Deterministic Contract Factory

This repository contains a factory contract which can be deployed to any chain on a deterministic address (i.e the same address in every chain).
This factory contract in turn leverages CREATE2 to deploy contracts at deterministic locations.

## Rationale
----
### Why would you use such a contact ?

The main idea behind this concept is that you can deploy the factory on top of any network at a deterministic address and then use it to
deploy other contracts in the same fashion. This can be useful, for example, to deploy "network level contracts" (i.e singleton contracts) on any network on the same addresses,
this way you can reduce the amount of setup needed for your applications by assuming the contracts are always present at the same addresses.

For example: I can deploy my dapp that relies on N singleton contracts on top of any network and assume those singleton contracts
are going to be deployed on the same addresses everytime, allowing me to skip the steps in which I deploy the contracts, get the addresses
in which they have been deployed and then configure the rest of my components to point to those addresses.

With enough thought you could even deploy your entire dapp and not only the singleton contracts into the same addresses on every network. Yay !!

### How does it work ?

To make this possible we leverage two things:

 * **Keyless Deployment Method:**

    In Ethereum to create a valid transaction, your first have to sign it using a private key.
    When we think about a transaction, something like this might come to mind:
    ```
        Transaction: {
            from: '',
            to: '',
            value: 0,
            data: '',
            ...
        }
    ```
    But in reality the `from` field is not set explicitly by the sender, instead it's computed
    from the signature of the transaction via a function called `ecrecover`. Since only the owner
    of that address can generate signatures that return that address only they can authorize the
    network to spend funds from their account.

    So the question is, what would happen if instead of signing the transaction the normal way,
    we filled the signature with some seemingly random values? It turns out that 50% of the time
    `ecrecover` returns a valid public key (and subsequently a valid address).
    With this in mind, we can build a transaction that can spend funds from a seemingly random addres
    all we need to do is fund it with enough ETH and we are good to go.
    
    As such, and taking into account how the address of a contract is computed with CREATE (`address = hash(sender, nonce)`)
    we craft the factory deployment transaction and signatures and we are able
    to deploy the factory at a deterministic address in every network - because the private key
    for that address is unknown, and we can prove that it's unknown by choosing the values in the
    signature in some predictable fashion thus proving to anyone that the address will only be usable
    for that transaction.

    **Caveats:**

    We have to make sure that the crafted transaction can always be executed, as such we need to choose
    a pretty **high gas price** and **send enough ETH to our "one-use address"** so its able to execute it.
    As such, the cost of deployment will be pretty high but on the possitive side we only need to deploy once per network.

 * **CREATE2:**
    
    It's an opcode introduced in the Constantinople hard frok which provides an alternative to the original `CREATE`.
    The main difference is that the address of the deployed contract is computed by the formula `address = hash(creator address, salt, contract creation code)`
    Since none of these values depend on the state of the creation (remember that CREATE depends on the nonce) this means that we can guarantee that the contract
    will be deployed at the same address independently of the state of the sender.

    **Caveats:**
    
    Since the address of the contract now depends on the contract creation code we have to make sure its deterministic to be able to get the same address everytime.
    For example, an ownable contract creation code will change depending on who the owner is set to be.
    To get around this issue, we can use initializers instead of contructors.

## What you need
----
### Deployment Transaction 
```
0xf905138085174876e800832dc6c08080b904c0608060405234801561001057600080fd5b506104a0806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063ca9ffe941461003b578063cdcb760a146100fe575b600080fd5b6100bc6004803603604081101561005157600080fd5b81019080803590602001909291908035906020019064010000000081111561007857600080fd5b82018360208201111561008a57600080fd5b803590602001918460018302840111640100000000831117156100ac57600080fd5b9091929391929390505050610203565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6101c16004803603604081101561011457600080fd5b81019080803590602001909291908035906020019064010000000081111561013b57600080fd5b82018360208201111561014d57600080fd5b8035906020019184600183028401116401000000008311171561016f57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050919291929050505061025d565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60006102548484848080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f8201169050808301925050505050505030610391565b90509392505050565b6000806000835114156102d8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f437265617465323a2062797465636f6465206c656e677468206973207a65726f81525060200191505060405180910390fd5b838351602085016000f59050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415610387576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260198152602001807f437265617465323a204661696c6564206f6e206465706c6f790000000000000081525060200191505060405180910390fd5b8091505092915050565b60008083805190602001209050600060ff60f81b84878460405160200180857effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff191681526001018473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1660601b8152601401838152602001828152602001945050505050604051602081830303815290604052805190602001209050606081901b60601c92505050939250505056fea265627a7a723158202fa0201ffa74b4ded23c225056d003b42e38a1a262d2e7ca1158cf21150b2b3664736f6c634300051100321ba0222222222222222222222222222222222222222222222222beefbeefbeefbeefa0222222222222222222222222222222222222222222222222beefbeefbeefbeef
```

### Generated Keyless Address (Factory Deployer)
```
0x1107Dd08bBeE561a2b571D0be982959503120c1e
```

### Deterministic Contract Factory Address 
```
0x8BAd4FEDD5f45ea95781A9b292199DA5C410C8e6
```

### ERC1820 Registry Address (Example of a singleton contract being deployed with our factory)
```
0x64fBCFd743E04cc62D52Bed5FdaC34eB2403A47b
```

### Example deployments

* [Deterministic Factory Goerli test-net](https://goerli.etherscan.io/tx/0x11a69dff54821c98f3eb11feba14129d456ce02d2bfb16701b8ec373daf55683)

* [ERC1820Registry Goerli test-net](https://goerli.etherscan.io/address/0x64fbcfd743e04cc62d52bed5fdac34eb2403a47b)

* [Deterministic Factory Rinkeby test-net](https://rinkeby.etherscan.io/tx/0x11a69dff54821c98f3eb11feba14129d456ce02d2bfb16701b8ec373daf55683)

* [ERC1820Registry Rinkeby test-net](https://rinkeby.etherscan.io/tx/https://rinkeby.etherscan.io/address/0x64fbcfd743e04cc62d52bed5fdac34eb2403a47b)

----
## References

### Keyless Deployment Method

* [How to send ETH to 11,440 people](https://medium.com/@weka/how-to-send-ether-to-11-440-people-187e332566b7)

### CREATE2

* [Getting the most out of CREATE2](https://blog.openzeppelin.com/getting-the-most-out-of-create2/)
* [The Promise and the Peril of Metamorphic Contracts](https://medium.com/@0age/the-promise-and-the-peril-of-metamorphic-contracts-9eb8b8413c5e)
* [CREATE2 Deployer library reference implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Create2.sol#L38)
* [The constructor caveat](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#the-constructor-caveat)