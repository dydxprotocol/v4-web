#!/usr/bin/env node
import { cpSync } from "fs"

cpSync("contracts/core/vault/src/", "contracts/vault-expose/src/", { recursive: true })
