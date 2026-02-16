(define-public (test-simple-flow)
    (begin
        (try! (my-test-function))
        (try! (my-test-function2))
        (ok true)))

(define-private (my-test-function)
    (ok true))

(define-private (my-test-function2)
    (ok true))
