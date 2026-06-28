import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CampaignCard from '@/components/CampaignCard';

const summary = {
  creator: 'GCREATORADDR1234567890XYZ',
  goal: 100_000_000n,
  deadline: 5000,
  raised: 50_000_000n,
  status: 0,
  milestoneCount: 2,
  releasedCount: 0,
};

describe('CampaignCard', () => {
  it('shows goal and raised in USDC', () => {
    render(<CampaignCard id="CABC123" summary={summary} now={1000} />);
    expect(screen.getByText(/5 \/ 10/)).toBeInTheDocument();
  });
  it('shows 50% progress', () => {
    render(<CampaignCard id="CABC123" summary={summary} now={1000} />);
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });
  it('shows ended when past deadline', () => {
    render(<CampaignCard id="CABC123" summary={summary} now={9999} />);
    expect(screen.getByText(/ended/i)).toBeInTheDocument();
  });
  it('shows milestone progress', () => {
    render(<CampaignCard id="CABC123" summary={summary} now={1000} />);
    expect(screen.getByText(/0\/2 milestones/)).toBeInTheDocument();
  });
});
