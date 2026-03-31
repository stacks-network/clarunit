;; @name test external contract call
(define-public (test-contract-call)
  (begin
    ;; @caller 'SP7DGES13508FHRWS1FB0J3SZA326FP6QRMB6JDE
    ;; @type-hints trait_reference
    (unwrap!
      (contract-call?
        'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd001-direct-execute
        direct-execute
        'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip024-miamicoin-signal-vote
      )
      (err "direct execute failed")
    )
    (ok true)
  )
)
