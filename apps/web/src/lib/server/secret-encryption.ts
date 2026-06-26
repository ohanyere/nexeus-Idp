import "server-only";

import { createRequire } from "node:module";

import type sodiumModule from "libsodium-wrappers";

const require = createRequire(import.meta.url);

export async function encryptGitHubActionsSecret(secretValue: string, publicKeyValue: string) {
 const sodium = require("libsodium-wrappers") as typeof sodiumModule;
 await sodium.ready;

 const publicKey = sodium.from_base64(publicKeyValue, sodium.base64_variants.ORIGINAL);
 const encryptedValue = sodium.crypto_box_seal(secretValue, publicKey);

 return sodium.to_base64(encryptedValue, sodium.base64_variants.ORIGINAL);
}
