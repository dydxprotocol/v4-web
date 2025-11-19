# Starboard - dockers

## Build

Build the fuel node images

```shell
cd fuel-core
docker build -t starboard/fuel-core .
```

Build the starboard project image
```shell
cd starboard
docker build -t starboard .
```

## Run

The services include:

- Fuel node
- Postgres DB for the indexer
- The indexer processor
- The indexer API

Do it one time on installation. There is no need to modify `.env` file afterwards.

```shell
cp .env.example .env.
```

Start the services

```shell
docker-compose up -d
```

Deploy the contracts The container must be any starboard.
Do it once per instantiation, only on a clean state - next execution yields other contract addresses.

```shell
docker exec -t starboard_indexer_processor bash -i -c /root/setup_starboard_contracts.sh
```

Shutdown the services:

```shell
docker-compose down -v
```

## Environment

There is no need to modify `.env` file.

Prefunded accounts (priv key, address):

- Deployer: `0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a` `0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6`
- User0: `0x366079294383ed426ef94b9e86a8e448876a92c1ead9bbf75e6e205a6f4f570d` `0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770`
- User1: `0xb978aa71a1487dc9c1f996493af73f0427cf78f560b606224e7f0089bae04c41` `0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c`
- Liquidator: `0xa5675fc7eb0657940fc73f6ec6c5265c045065ddac62e12e1174da030f3868b3` `0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088`
- PriceSigner: `0xb19556cb693d7850d0e75d05a6e2e4c9ed5691d9e5bc54a7d43ee6eed3ad5fe3` `0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b`

Of course, the roles above are conventional.

## Fuel Wallet integration

Open a web browser and open the fuel browser extention (README does not cover Fuel Wallet installation).
Find `add network` option. The params of the new local network:

```
URL:
http://localhost:4000/v1/graphql

ChainId:
0
```

## Front End

Configuration useful for FE:

```
The indexer address:
http://localhost:4350/v1/graphql

The local fuel node endpoint:
http://localhost:4000/v1/graphql

ChainId of local fuel network:
0

Vault contract address:
0x4A1Aa5E2e2f1A6233a189f2F882a6065134fBD3133f1a1f4b8c61D275ba32615

USDC contract address (needed for minting test tokens):
0x9534954321965C4B2dC45712AC3e7B575AFD43C38d2c9834bb5232f5F2BF2c6E

USDC assetId (needed to transfer coins):
0xda81350458510a2b4adfb85032ad319a61f271e9ccabe702c96696efc72bc6de

Stork Mock address (must be included in a transaction to modify a position):
0x422729Dc06fD5811ec48eDf38915a52aa6383B3a2e91a7f45F1eECaAba2aEf81

PricefeedWrapper (must be included in a transaction to modify a position):
0x212EB3F8Ff08392B2aa030768A3814fc5A0a67F94412CfE07e37DD1cbC24F9D6
```

In order to mint USDC tokens run the following command.
This executes the token's faucet.
Fill `USER_PRIVATE_KEY`, the user related to this private key receives tokens.
It is required to send a transaction.
The user gets 1M USDC.
WARNING. Using valuable private keys in this way is not safe.

```shell
docker exec -t -e PRIV_K=USER_PRIVATE_KEY --env-file .env starboard_indexer_processor bash -i -c "pnpm --filter starboard/contracts faucet --url=http://starboard_fuel_core:4000/v1/graphql --privK=\${PRIV_K} --token=\${USDC_ADDRESS}"
```

## Fuel node image

The snapshot is prepared based on [this](https://github.com/FuelLabs/fuels-wallet/blob/master/docker/fuel-core/Dockerfile).
The Dockerfile is obsolete, so we used updated versions.
If you need to further update the version, again follow the steps in the linked source to prepare the snapshot.
If you need more accounts, update `genesis_coins.json` and the snapshot.

## Starboard image

The starboard image contains the starboard project, installed and build.
The steps are consistent with CI.

The project is provided with `git clone`. 
At the moment the reference branch is `lglen/feat/STAR-306-indexer-update` which contains the indexer.
If the branch is changed or the remote branch is changed in the repo,
the image must be force rebuild.

## Contracts

The contracts deployments are not part of start up, it must be a separate step, see above.
It may be fixed in the future.

The contracts addresses are set in the deterministic manner.
So every deployment on the clean setup yields the same addresses.

WARNING! If the contracts code is modified, usually because of the repo change, the addresses will change too.
In that case the addresses in `.env` must be updated, this is the indexer configuration.

