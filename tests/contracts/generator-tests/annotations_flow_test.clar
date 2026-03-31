;; @name test block height at launch
(define-public (test-block-height-at-launch)
  (begin
    ;; @caller 'SP1T91N2Y2TE5M937FE3R6DE0HGWD85SGCV50T95A
    (try! (assert-block-height-3))
    ;; @mine-blocks-before 10
    ;; @caller wallet_1
    (try! (assert-block-height-13))
    (ok true)
  )
)

(define-public (assert-block-height-3)
  (begin
    (asserts! (is-eq u3491158 stacks-block-height)
      (err (concat "expected block height 3491158, found "
        (int-to-ascii stacks-block-height)
      ))
    )
    (ok true)
  )
)

(define-public (assert-block-height-13)
  (begin
    (asserts! (is-eq u3491168 stacks-block-height)
      (err (concat "expected block height 3491168, found "
        (int-to-ascii stacks-block-height)
      ))
    )
    (ok true)
  )
)
