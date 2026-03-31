;; @name test list args in flow test
(define-public (test-list-args)
  (begin
    ;; @caller wallet_1
    (unwrap!
      (contract-call? .some-contract
        fn-with-list-args
        (list 0xdeadbeef 0xcafebabe)
        (list true false)
      )
      (err "failed")
    )
    (ok true)
  )
)