import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { EchoTokenPurchase } from '../components/EchoTokenPurchase';
import { MockEchoProvider, mockStates } from './MockEchoProvider';

const meta: Meta<typeof EchoTokenPurchase> = {
  title: 'Echo SDK/EchoTokenPurchase',
  component: EchoTokenPurchase,
  parameters: {
    docs: {
      description: {
        component:
          "The EchoTokenPurchase component allows users to purchase tokens through Stripe. It opens a payment popup and automatically refreshes the user's balance after successful payment.",
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <MockEchoProvider mockState={mockStates.authenticated}>
        <div style={{ padding: '20px' }}>
          <Story />
        </div>
      </MockEchoProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    amount: 100,
    onPurchaseComplete: balance => console.log('Purchase complete:', balance),
    onError: error => console.error('Purchase error:', error),
  },
};

export const Small: Story = {
  args: {
    amount: 50,
    onPurchaseComplete: balance => console.log('Purchase complete:', balance),
    onError: error => console.error('Purchase error:', error),
  },
};

export const Large: Story = {
  args: {
    amount: 500,
    onPurchaseComplete: balance => console.log('Purchase complete:', balance),
    onError: error => console.error('Purchase error:', error),
  },
};

export const WithCustomButton: Story = {
  args: {
    amount: 250,
    onPurchaseComplete: balance => console.log('Purchase complete:', balance),
    onError: error => console.error('Purchase error:', error),
    children: (
      <button
        style={{
          padding: '16px 32px',
          background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        💎 Buy 250 Premium Tokens
      </button>
    ),
  },
};

export const MinimalStyle: Story = {
  args: {
    amount: 100,
    className: 'minimal-purchase',
    onPurchaseComplete: balance => console.log('Purchase complete:', balance),
    onError: error => console.error('Purchase error:', error),
    children: (
      <button
        style={{
          padding: '8px 16px',
          background: 'transparent',
          color: '#1f9ae0',
          border: '1px solid #1f9ae0',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Buy tokens
      </button>
    ),
  },
};

export const WithCallbacks: Story = {
  args: {
    amount: 200,
    onPurchaseComplete: balance => {
      console.log('✅ Purchase successful!', balance);
      alert(
        `Purchase complete! New balance: ${balance.credits} ${balance.currency}`
      );
    },
    onError: error => {
      console.error('❌ Purchase failed:', error);
      alert(`Purchase failed: ${error.message}`);
    },
  },
};

export const UnauthenticatedState: Story = {
  decorators: [
    Story => (
      <div style={{ padding: '20px' }}>
        <p style={{ marginBottom: '16px', color: '#666' }}>
          This shows how the component appears when the user is not signed in:
        </p>
        <Story />
      </div>
    ),
  ],
  args: {
    amount: 100,
  },
};
