;; test block-height at launch
;; One block is need to advance to epoch 2.5
(define-public (test-block-height-at-launch)
  (begin
    (asserts! (is-eq u3491158 stacks-block-height)
      (err (concat "expected block height 3491158, found "
        (int-to-ascii stacks-block-height)
      ))
    )
    (ok true)
  )
)

;; @mine-blocks-before 10
(define-public (test-mine-blocks-before)
  (begin
    (asserts! (is-eq u3491168 stacks-block-height)
      (err (concat "expected block height 3491168, found "
        (int-to-ascii stacks-block-height)
      ))
    )
    (ok true)
  )
)

;; @caller wallet_1
(define-public (test-caller)
  (begin
    (asserts! (is-eq tx-sender 'SP1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2XG1V316)
      (err tx-sender)
    )
    (asserts! (is-eq contract-caller 'SP1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2XG1V316)
      (err contract-caller)
    )
    (ok true)
  )
)

;; @caller 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE
(define-public (test-caller-2)
  (begin
    (asserts! (is-eq tx-sender 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE)
      (err tx-sender)
    )
    (asserts! (is-eq contract-caller 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE)
      (err contract-caller)
    )
    (ok true)
  )
)
