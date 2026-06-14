import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionSidebar } from '@/components/chat/SessionSidebar';

const sessions = [
  { id: 's1', title: 'Price research', messageCount: 4 },
  { id: 's2', messageCount: 0 }, // untitled
];

function setup(overrides = {}) {
  const props = {
    sessions,
    currentSessionId: 's1',
    onSelectSession: vi.fn(),
    onNewSession: vi.fn(),
    onDeleteSession: vi.fn(),
    ...overrides,
  };
  render(<SessionSidebar {...props} />);
  return props;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SessionSidebar', () => {
  it('renders session titles, falling back to "New chat" for untitled sessions', () => {
    setup();
    expect(screen.getByText('Price research')).toBeInTheDocument();
    // Untitled session + the New chat button both read "New chat"
    expect(screen.getAllByText('New chat').length).toBeGreaterThanOrEqual(2);
  });

  it('highlights the active session', () => {
    const { container } = render(
      <SessionSidebar
        sessions={sessions}
        currentSessionId="s1"
        onSelectSession={vi.fn()}
        onNewSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );
    expect(container.querySelector('.bg-primary-100')).toBeTruthy();
  });

  it('calls onSelectSession when a session is clicked', () => {
    const props = setup();
    fireEvent.click(screen.getByText('Price research'));
    expect(props.onSelectSession).toHaveBeenCalledWith('s1');
  });

  it('calls onNewSession when the New chat button is clicked', () => {
    const props = setup();
    // The button is the one with the MessageSquarePlus icon — first "New chat"
    const newChatButton = screen.getAllByText('New chat')[0].closest('button')!;
    fireEvent.click(newChatButton);
    expect(props.onNewSession).toHaveBeenCalled();
  });

  it('deletes only after confirmation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const props = setup();

    const deleteButtons = screen.getAllByLabelText('Delete conversation');
    fireEvent.click(deleteButtons[0]);
    expect(confirmSpy).toHaveBeenCalled();
    expect(props.onDeleteSession).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(deleteButtons[0]);
    expect(props.onDeleteSession).toHaveBeenCalledWith('s1');
  });

  it('shows skeletons while loading', () => {
    render(
      <SessionSidebar
        sessions={[]}
        currentSessionId={null}
        onSelectSession={vi.fn()}
        onNewSession={vi.fn()}
        onDeleteSession={vi.fn()}
        loading
      />,
    );
    expect(screen.getByTestId('sessions-skeleton')).toBeInTheDocument();
  });

  it('shows an empty state when there are no sessions', () => {
    render(
      <SessionSidebar
        sessions={[]}
        currentSessionId={null}
        onSelectSession={vi.fn()}
        onNewSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });
});
