# clarunit

This package allows you to write unit tests for Clarity smart contracts in the
Clarity language itself, as opposed to TypeScript. `clarunit` will automatically
detect test files and test functions.

An example Clarinet-sdk project using `clarunit` can be found in the `example`
folder.

## Setup

1. Install package `@stacks/clarunit` using your favourite package manager. (Be sure to
   pin the version!)
2. Create a test file in your existing `tests` folder, you can use any name but
   using `clarunit.test.ts` is recommended.
3. Add the following to the newly created file:
   ```ts
   import { clarunit } from "clarunit";
   clarunit(simnet);
   ```
4. Run your tests per usual using `npm test` or `yarn test`.

`clarunit` takes configuration from Clarinet via `Clarinet.toml`. It
automatically detects all instantiated test contracts.

## Unit testing

### Adding tests

To write unit tests, follow these steps:

1. Create a new Clarity contract in the `./tests` folder. It can have any name
   but it should end in `_test.clar`. Files that do not follow this convention
   are ignored. (For example: `my-contract_test.clar` will be included and
   `my-contract.clar` will not.)
2. Add the new Clarity contract to `Clarinet.toml`.
3. Write unit tests as public functions, the function name must start with
   `test-`.

### Writing tests

Unit test functions should be public without parameters. If they return an `ok`
response of any kind, the test is considered to have passed whereas an `err`
indicates a failure. The failure value is printed so it can be used to provide a
helpful message. The body of the unit test is written like one would usually
write Clarity, using `try!` and `unwrap!` and so on as needed.

Example:

```clarity
(define-public (test-my-feature)
	(begin
		(unwrap! (contract-call? .some-project-contract my-feature) (err "Calling my-feature failed"))
		(ok true)
	)
)
```

### Prepare function

Sometimes you need to run some preparation logic that is common to all or
multiple unit tests. If the script detects a function called `prepare`, it will
be invoked before calling the unit test function itself. The `prepare` function
should return an `ok`, otherwise the test fails.

```clarity
(define-public (prepare)
	(begin
		(unwrap! (contract-call? .some-project-contract prepare-something) (err "Preparation failed"))
		(ok true)
	)
)

(define-public (test-something)
	;; prepare will be executed before running the test.
)
```

### Annotations

You can add certain comment annotations before unit test functions to add
information or modify behaviour. Annotations are optional.

| Annotation            | Description                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `@name`               | Give the unit test a name, this text shows up when running unit tests.                                                                       |
| `@no-prepare`         | Do not call the `prepare` function before running this unit test.                                                                            |
| `@prepare`            | Override the default `prepare` function with another. The function name should follow the tag.                                               |
| `@caller`             | Override the default caller when running this unit test. Either specify an account name or standard principal prefixed by a single tick `'`. |
| `@mine-blocks-before` | Mine a number of blocks before running the test. The number of blocks should follow the tag.                                                 |

Examples:

```clarity
(define-public (prepare) (ok "Default prepare function"))

(define-public (custom-prepare) (ok "A custom prepare function"))

;; A test without any annotations
(define-public (test-zero) (ok true))

;; @name A normal test with a name, the prepare function will run before.
(define-public (test-one) (ok true))

;; @name This test will be executed without running the default prepare function.
;; @no-prepare
(define-public (test-two) (ok true))

;; @name Override the default prepare function, it will run custom-prepare instead.
;; @prepare custom-prepare
(define-public (test-three) (ok true))

;; @name This test will be called with tx-sender set to wallet_1 (from the settings toml file).
;; @caller wallet_1
(define-public (test-four) (ok true))

;; @name This test will be called with tx-sender set to the specified principal.
;; @caller 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
(define-public (test-five) (ok true))

;; @name Five blocks are mined before this test is executed.
;; @mine-blocks-before 5
(define-public (test-six) (ok true))
```

### Flow Tests

Normal unit tests run always through the test contract using the deployer account. With flow tests it is possible to test a sequence of contract calls with different accounts.

The tests have to follow the following structure:

- flow test contract names end with `_flow_test`
- test functions in flow test contracts start with `test-`
- the body of a test function consists of a `begin` with a sequence of `try!` or `unwrap!` calls.
- `try!` calls call another function without arguments in the test contract
- `unwrap!` calls can call any contract function
- each of these calls must be annotated with the caller annotation

The example contains a simple flow test in `example/tests/my-contract_flow_test.clar`
