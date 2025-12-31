#!/usr/bin/env node
import concat from 'concat';

await concat(
  ['contracts/vault-expose/src/main.sw', 'contracts/vault-expose/vault-expose.txt'],
  'contracts/vault-expose/src/main.sw'
);
