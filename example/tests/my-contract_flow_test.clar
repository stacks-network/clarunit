;; @name sender
;; @format-ignore
(define-public (test-sender)
  (begin
    ;; @caller deployer
    (try! (simple-test))
    ;; @caller wallet_1
    (unwrap! (contract-call? .my-contract get-sender) (err "should never fail"))
    ;; @caller wallet_2
    (unwrap! (contract-call? 'ST000000000000000000002AMW42H.pox-4 allow-contract-caller .pox4-self-service-multi none) (err "allow-contract-caller failed"))
    (ok true)
  )
)
;; @name sender failure
(define-public (test-failure)
  (begin
    (try! (failed-test))
    (ok true)
  )
)

(define-public (simple-test)
  (begin
    (asserts!
      (is-eq (ok 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
        (contract-call? .my-contract get-sender)
      )
      (err "sender should be deployer account")
    )
    (ok true)
  )
)

(define-public (failed-test)
  (begin
    (asserts!
      (is-eq (ok 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
        (contract-call? .my-contract get-sender)
      )
      (err "sender should be deployer account")
    )
    (ok true)
  )
)
