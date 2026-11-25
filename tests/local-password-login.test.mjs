import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { validLoginInput, legacyBcryptHash, publicLocalAccount } = require("../src/lib/localPasswordLogin.ts");

test("normalizes an email and preserves password bytes", () => {
  assert.deepEqual(validLoginInput({email:"  SELLER@Example.com  ",password:" x "}),{email:"seller@example.com",password:" x "});
});
test("rejects bad input, oversize fields and missing password", () => {
  for(const x of [null,[],{}, {email:"a@b.com"},{email:"no-at",password:"abc"},{email:"a@b.com",password:""},{email:"a@b.com",password:"x".repeat(1025)}]) assert.equal(validLoginInput(x),null);
});
test("recognizes legacy PHP bcrypt $2y$ without changing hash payload", () => {
  const raw="$2y$10$"+"A".repeat(53);
  assert.equal(legacyBcryptHash(raw),"$2a$10$"+"A".repeat(53));
  assert.equal(legacyBcryptHash("plaintext"),null);
  assert.equal(legacyBcryptHash(null),null);
});
test("only allowlisted account profile fields leave the API", () => {
  const x=publicLocalAccount({id:7,fname:"A",lname:"B",email:"a@b.com",is_seller:1,company_id:2,password:"sensitive",real_password:"secret"});
  assert.equal(x.password,undefined);assert.equal(x.real_password,undefined);
  assert.deepEqual(Object.keys(x),["id","fname","lname","email","is_seller","company_id"]);
});
