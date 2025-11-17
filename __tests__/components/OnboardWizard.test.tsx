import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardWizard } from '@/components/OnboardWizard';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/store', () => ({
  useAppStore: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  httpCreateNewApp: jest.fn(),
  setSourcesSiteCrawl: jest.fn(),
  postDocument: jest.fn(),
}));

describe('OnboardWizard', () => {
  const mockPush = jest.fn();
  const mockDoAddApp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useAppStore as jest.Mock).mockReturnValue({
      doAddApp: mockDoAddApp,
    });
  });

  it('renders source selection step', () => {
    render(<OnboardWizard />);

    expect(screen.getByText(/choose knowledge source/i)).toBeInTheDocument();
    expect(screen.getByText(/website url/i)).toBeInTheDocument();
    expect(screen.getByText(/upload documents/i)).toBeInTheDocument();
  });

  it('navigates to website config when website is selected', () => {
    render(<OnboardWizard />);

    const websiteButton = screen.getByText(/website url/i).closest('button');
    fireEvent.click(websiteButton!);

    expect(screen.getByText(/website configuration/i)).toBeInTheDocument();
  });

  it('navigates to documents config when documents is selected', () => {
    render(<OnboardWizard />);

    const documentsButton = screen.getByText(/upload documents/i).closest('button');
    fireEvent.click(documentsButton!);

    expect(screen.getByText(/upload documents/i)).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(<OnboardWizard />);

    // Check for step numbers
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('validates required fields before proceeding', async () => {
    render(<OnboardWizard />);

    // Select website
    const websiteButton = screen.getByText(/website url/i).closest('button');
    fireEvent.click(websiteButton!);

    // Try to continue without URL
    const continueButton = screen.getByText(/continue/i);
    fireEvent.click(continueButton);

    // Should show error or stay on same step
    await waitFor(() => {
      expect(screen.getByText(/website configuration/i)).toBeInTheDocument();
    });
  });
});

