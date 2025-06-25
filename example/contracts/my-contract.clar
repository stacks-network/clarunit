(define-public (a-times-b
    (a uint)
    (b uint)
  )
  (ok (* a b))
)

(define-public (a-div-b
    (a uint)
    (b uint)
  )
  (err "not implemented")
)

(define-public (get-sender)
  (ok tx-sender)
)

(define-public (get-caller)
  (ok contract-caller)
)
