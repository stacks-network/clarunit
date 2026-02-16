(define-public (test-bad-flow)
    (begin
        (try! (my-test-function))
        (ok true)))


(define-private (my-test-function)
    (ok true))
