# Decentralized Identity Reputation System (DIRS)

A blockchain-based reputation system that assigns and manages user reputation scores based on on-chain activities across different decentralized applications (dApps). Built on the Stacks blockchain using Clarity smart contracts.

## Overview

DIRS provides a comprehensive framework for tracking and managing user reputation across different blockchain activities:
- Lending protocol interactions
- Governance participation
- Prediction market activity

### Key Features

- **Decentralized Identity Integration**: All reputation scores are tied to user DIDs
- **Multi-Source Scoring**: Aggregates reputation from various on-chain activities
- **Composable Design**: Modular architecture allows easy integration with new dApps
- **Transparent Scoring**: All scoring mechanisms are public and verifiable
- **Cross-Protocol Benefits**: Users can leverage their reputation across different protocols

## Architecture

### Core Components

1. **Reputation System Contract** (`reputation-system.clar`)
    - Manages global reputation scores
    - Handles contract authorization
    - Provides score aggregation logic
    - Maintains user reputation history

2. **Lending Reputation Contract** (`lending-reputation.clar`)
    - Tracks lending protocol interactions
    - Records borrowing and repayment history
    - Calculates lending-specific reputation scores

3. **Test Suite** (`reputation-system.test.ts`)
    - Comprehensive testing coverage
    - Integration tests
    - Edge case handling

## Getting Started

### Prerequisites

- [Stacks CLI](https://docs.stacks.co/get-started/command-line)
- Node.js v14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/dirs
cd dirs
```

2. Install dependencies:
```bash
npm install
```

3. Run tests:
```bash
npm test
```

### Deployment

1. Set up your Stacks wallet and get testnet STX:
```bash
stacks setup
```

2. Deploy the contracts:
```bash
stacks deploy reputation-system.clar
stacks deploy lending-reputation.clar
```

## Usage

### Integrating with the Reputation System

1. **Request Authorization**
   ```clarity
   ;; Call from your contract
   (contract-call? .reputation-system add-authorized-contract tx-sender)
   ```

2. **Initialize User**
   ```clarity
   ;; Initialize a new user in the system
   (contract-call? .reputation-system initialize-user user-principal)
   ```

3. **Update Reputation Scores**
   ```clarity
   ;; Update lending reputation
   (contract-call? .reputation-system update-lending-score user-principal score)
   ```

### Example: Lending Protocol Integration

```clarity
;; Record a successful loan repayment
(define-public (record-repayment (user principal) (amount uint))
    (begin
        (try! (record-repayment-internal user amount))
        (contract-call? .reputation-system update-lending-score user 10)
    )
)
```

## Testing

The project includes a comprehensive test suite built with Vitest:

```bash
# Run all tests
npm test

# Run specific test file
npm test reputation-system.test.ts

# Run with coverage
npm test -- --coverage
```

## Security Considerations

1. **Authorization**
    - Only authorized contracts can update reputation scores
    - Admin functions are protected with proper checks

2. **Score Manipulation**
    - Scores are bounded to prevent overflow
    - Multiple sources required for significant reputation changes

3. **Contract Upgrades**
    - Admin can authorize new contracts
    - Score calculation logic can be adjusted if needed

## Project Structure

```
dirs/
├── contracts/
│   ├── reputation-system.clar
│   └── lending-reputation.clar
├── tests/
│   ├── reputation-system.test.ts
│   └── test-utils.ts
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

1. **Governance Integration**
    - DAO participation tracking
    - Proposal quality scoring
    - Voting history analysis

2. **Prediction Markets**
    - Accuracy tracking
    - Volume-weighted scoring
    - Market maker reputation

3. **Cross-Chain Integration**
    - Bridge to other blockchain networks
    - Universal reputation scoring
    - Cross-chain identity verification

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Stacks Foundation
- Clarity Lang Documentation
- Community Contributors
