import { Chain, Account } from '@stacks/transactions';

export const factory = {
    createTestChain: async () => {
        return new Chain({
            networkId: 1337, // Local testnet
            blockTime: 0,
            mineBlocks: true
        });
    },

    // Helper to create test accounts with initial balance
    createTestAccount: async (chain: Chain, name: string) => {
        const account = new Account(name);
        await chain.createAccount(account, 1000000); // Initial balance of 1M microSTX
        return account;
    },

    // Helper to advance blockchain by n blocks
    advanceBlocks: async (chain: Chain, blocks: number) => {
        for (let i = 0; i < blocks; i++) {
            await chain.mineBlock();
        }
    }
};
