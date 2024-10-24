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
