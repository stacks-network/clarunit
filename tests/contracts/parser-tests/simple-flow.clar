;;@name simple flow test
(define-public (test-simple-flow)
    (begin
        ;; @caller wallet_1
        (try! (my-test-function))
        ;; @caller wallet_2
        (try! (my-test-function2))
        ;; @caller wallet_1
        (unwrap! (contract-call? 'ST000000000000000000002AMW42H.pox-4 allow-contract-caller .pox4-self-service-multi none) (err "allow-contract-caller failed"))
        (ok true)))

(define-public (my-test-function)
    (ok true))

(define-public (my-test-function2)
    (ok true))