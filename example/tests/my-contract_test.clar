(define-public (test-a-times-b1)
  (begin
    (asserts! (is-eq (ok u8) (contract-call? .my-contract a-times-b u2 u4))
      (err "u2 * u4 should have been equal to u8")
    )
    (ok true)
  )
)

(define-public (test-a-times-b2)
  (begin
    (asserts! (is-eq (ok u108) (contract-call? .my-contract a-times-b u9 u12))
      (err "u9 * u12 should have been equal to u108")
    )
    (ok true)
  )
)

;; This one will fail so you can see what a failed clarunit test looks like.
(define-public (test-a-div-b)
  (begin
    (asserts! (is-eq (ok u5) (contract-call? .my-contract a-div-b u10 u2))
      (err "u10 / u2 should have been equal to u5")
    )
    (ok true)
  )
)
