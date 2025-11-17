import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader } from '@/components/FileUploader';

describe('FileUploader', () => {
  const mockOnFilesChange = jest.fn();

  beforeEach(() => {
    mockOnFilesChange.mockClear();
  });

  it('renders file upload area', () => {
    render(
      <FileUploader
        files={[]}
        onFilesChange={mockOnFilesChange}
        acceptedTypes=".pdf,.docx,.txt"
      />
    );

    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.docx,.txt';
    
    render(
      <FileUploader
        files={[]}
        onFilesChange={mockOnFilesChange}
        acceptedTypes=".pdf,.docx,.txt"
      />
    );

    const input = screen.getByLabelText(/click to upload/i).closest('label')?.querySelector('input');
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalled();
      });
    }
  });

  it('displays uploaded files', () => {
    const files = [
      new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
      new File(['content2'], 'file2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    ];

    render(
      <FileUploader
        files={files}
        onFilesChange={mockOnFilesChange}
        acceptedTypes=".pdf,.docx,.txt"
      />
    );

    expect(screen.getByText('file1.pdf')).toBeInTheDocument();
    expect(screen.getByText('file2.docx')).toBeInTheDocument();
    expect(screen.getByText(/uploaded files \(2\)/i)).toBeInTheDocument();
  });

  it('removes file when delete button is clicked', () => {
    const files = [
      new File(['content'], 'test.pdf', { type: 'application/pdf' }),
    ];

    render(
      <FileUploader
        files={files}
        onFilesChange={mockOnFilesChange}
        acceptedTypes=".pdf,.docx,.txt"
      />
    );

    const removeButton = screen.getByLabelText('Remove file');
    fireEvent.click(removeButton);

    expect(mockOnFilesChange).toHaveBeenCalledWith([]);
  });

  it('shows upload progress when provided', () => {
    const files = [
      new File(['content'], 'test.pdf', { type: 'application/pdf' }),
    ];
    const progress = { 'test.pdf': 50 };

    render(
      <FileUploader
        files={files}
        onFilesChange={mockOnFilesChange}
        progress={progress}
        acceptedTypes=".pdf,.docx,.txt"
      />
    );

    const progressBar = screen.getByText('test.pdf').closest('div')?.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });
});

