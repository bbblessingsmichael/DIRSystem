import { describe, test, expect, beforeEach } from 'vitest';
import { Chain, Account, types } from '@stacks/transactions';
import { factory } from './test-utils.js';

describe('Reputation System', () => {
  let chain: Chain;
  let deployer: Account;
  let user1: Account;
  let user2: Account;
  let lendingContract: Account;
  
  beforeEach(async () => {
    // Initialize new chain and accounts for each test
    chain = await factory.createTestChain();
    deployer = chain.createAccount('deployer');
    user1 = chain.createAccount('user1');
    user2 = chain.createAccount('user2');
    lendingContract = chain.createAccount('lending');
    
    // Deploy contracts
    await chain.deployContract('reputation-system', deployer);
    await chain.deployContract('lending-reputation', deployer);
    
    // Authorize lending contract
    await chain.executeContract(
        'reputation-system',
        'add-authorized-contract',
        [types.principal(lendingContract.address)],
        deployer
    );
  });
  
  describe('Core Reputation System', () => {
    test('should initialize user with zero scores', async () => {
      const result = await chain.executeContract(
          'reputation-system',
          'initialize-user',
          [types.principal(user1.address)],
          lendingContract
      );
      
      expect(result.success).toBe(true);
      
      const userScore = await chain.callReadOnlyContract(
          'reputation-system',
          'get-user-score',
          [types.principal(user1.address)]
      );
      
      expect(userScore).toEqual({
        total-score: 0,
      lending-score: 0,
      governance-score: 0,
      prediction-score: 0,
      last-updated: expect.any(Number)
    });
    });
    
    test('should update lending score', async () => {
      // First initialize user
      await chain.executeContract(
          'reputation-system',
          'initialize-user',
          [types.principal(user1.address)],
          lendingContract
      );
      
      // Update lending score
      const result = await chain.executeContract(
          'reputation-system',
          'update-lending-score',
          [
            types.principal(user1.address),
            types.int(50)
          ],
          lendingContract
      );
      
      expect(result.success).toBe(true);
      
      const userScore = await chain.callReadOnlyContract(
          'reputation-system',
          'get-user-score',
          [types.principal(user1.address)]
      );
      
      expect(userScore.lending-score).toBe(50);
      expect(userScore.total-score).toBe(16); // (50 + 0 + 0) / 3
    });
    
    test('should fail when unauthorized contract calls', async () => {
      const result = await chain.executeContract(
          'reputation-system',
          'update-lending-score',
          [
            types.principal(user1.address),
            types.int(50)
          ],
          user2 // Unauthorized caller
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(1000); // ERR_UNAUTHORIZED
    });
    
    test('should reject invalid score values', async () => {
      const result = await chain.executeContract(
          'reputation-system',
          'update-lending-score',
          [
            types.principal(user1.address),
            types.int(101) // Greater than allowed maximum
          ],
          lendingContract
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(1001); // ERR_INVALID_SCORE
    });
  });
  
  describe('Lending Reputation', () => {
    test('should record borrowing activity', async () => {
      const result = await chain.executeContract(
          'lending-reputation',
          'record-borrow',
          [
            types.principal(user1.address),
            types.uint(1000)
          ],
          lendingContract
      );
      
      expect(result.success).toBe(true);
      
      const history = await chain.callReadOnlyContract(
          'lending-reputation',
          'get-lending-history',
          [types.principal(user1.address)]
      );
      
      expect(history).toEqual({
        total-borrowed: 1000,
      total-repaid: 0,
    default-count: 0,
      last-action: expect.any(Number)
    });
    });
    
    test('should calculate correct lending score after repayment', async () => {
      // Record borrow
      await chain.executeContract(
          'lending-reputation',
          'record-borrow',
          [
            types.principal(user1.address),
            types.uint(1000)
          ],
          lendingContract
      );
      
      // Record repayment
      await chain.executeContract(
          'lending-reputation',
          'record-repayment',
          [
            types.principal(user1.address),
            types.uint(1000)
          ],
          lendingContract
      );
      
      const history = await chain.callReadOnlyContract(
          'lending-reputation',
          'get-lending-history',
          [types.principal(user1.address)]
      );
      
      expect(history.total-repaid).toBe(1000);
      
      // Check reputation score
      const userScore = await chain.callReadOnlyContract(
          'reputation-system',
          'get-user-score',
          [types.principal(user1.address)]
      );
      
      expect(userScore.lending-score).toBe(100); // Perfect score for full repayment
    });
    
    test('should penalize score for defaults', async () => {
      // Record default
      await chain.executeContract(
          'lending-reputation',
          'record-default',
          [types.principal(user1.address)],
          lendingContract
      );
      
      const userScore = await chain.callReadOnlyContract(
          'reputation-system',
          'get-user-score',
          [types.principal(user1.address)]
      );
      
      expect(userScore.lending-score).toBeLessThan(100);
      expect(userScore.lending-score).toBeGreaterThanOrEqual(0);
    });
    
    test('should handle multiple activities for same user', async () => {
      // Record multiple activities
      await chain.executeContract(
          'lending-reputation',
          'record-borrow',
          [
            types.principal(user1.address),
            types.uint(1000)
          ],
          lendingContract
      );
      
      await chain.executeContract(
          'lending-reputation',
          'record-repayment',
          [
            types.principal(user1.address),
            types.uint(500)
          ],
          lendingContract
      );
      
      await chain.executeContract(
          'lending-reputation',
          'record-default',
          [types.principal(user1.address)],
          lendingContract
      );
      
      const history = await chain.callReadOnlyContract(
          'lending-reputation',
          'get-lending-history',
          [types.principal(user1.address)]
      );
      
      expect(history).toEqual({
        total-borrowed: 1000,
      total-repaid: 500,
    default-count: 1,
      last-action: expect.any(Number)
    });
    });
  });
  
  describe('Integration Tests', () => {
    test('should properly integrate lending activity with main reputation', async () => {
      // Initialize user
      await chain.executeContract(
          'reputation-system',
          'initialize-user',
          [types.principal(user1.address)],
          lendingContract
      );
      
      // Record lending activity
      await chain.executeContract(
          'lending-reputation',
          'record-borrow',
          [
            types.principal(user1.address),
            types.uint(1000)
          ],
          lendingContract
      );
      
      await chain.executeContract(
          'lending-reputation',
          'record-repayment',
          [
            types.principal(user1.address),
            types.uint(1000)
          ],
          lendingContract
      );
      
      // Verify reputation update
      const userScore = await chain.callReadOnlyContract(
          'reputation-system',
          'get-user-score',
          [types.principal(user1.address)]
      );
      
      expect(userScore.lending-score).toBe(100);
      expect(userScore.total-score).toBe(33); // (100 + 0 + 0) / 3
    });
    
    test('should handle concurrent updates from different sources', async () => {
      // Initialize user
      await chain.executeContract(
          'reputation-system',
          'initialize-user',
          [types.principal(user1.address)],
          lendingContract
      );
      
      // Update different scores
      await chain.executeContract(
          'reputation-system',
          'update-lending-score',
          [
            types.principal(user1.address),
            types.int(60)
          ],
          lendingContract
      );
      
      await chain.executeContract(
          'reputation-system',
          'update-governance-score',
          [
            types.principal(user1.address),
            types.int(80)
          ],
          lendingContract
      );
      
      await chain.executeContract(
          'reputation-system',
          'update-prediction-score',
          [
            types.principal(user1.address),
            types.int(70)
          ],
          lendingContract
      );
      
      const userScore = await chain.callReadOnlyContract(
          'reputation-system',
          'get-user-score',
          [types.principal(user1.address)]
      );
      
      expect(userScore.total-score).toBe(70); // (60 + 80 + 70) / 3
    });
  });
});
