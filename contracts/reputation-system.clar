;; reputation-system.clar
;; Core contract for managing reputation scores

(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_INVALID_SCORE (err u1001))
(define-constant ERR_NOT_FOUND (err u1002))

;; Data vars and maps
(define-map user-scores
    principal
    {
        total-score: uint,
        lending-score: uint,
        governance-score: uint,
        prediction-score: uint,
        last-updated: uint
    }
)

(define-map authorized-contracts
    principal
    bool
)

(define-data-var admin principal tx-sender)

;; Administrative functions
(define-public (set-admin (new-admin principal))
    (begin
        (asserts! (is-eq tx-sender (var-get admin)) ERR_UNAUTHORIZED)
        (ok (var-set admin new-admin))
    )
)

(define-public (add-authorized-contract (contract-principal principal))
    (begin
        (asserts! (is-eq tx-sender (var-get admin)) ERR_UNAUTHORIZED)
        (ok (map-set authorized-contracts contract-principal true))
    )
)

;; Core reputation functions
(define-public (initialize-user (user principal))
    (begin
        (asserts! (is-authorized-contract contract-caller) ERR_UNAUTHORIZED)
        (ok (map-set user-scores user {
            total-score: u0,
            lending-score: u0,
            governance-score: u0,
            prediction-score: u0,
            last-updated: block-height
        }))
    )
)
