import { toast } from 'react-toastify';

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    toast.success('Copied to clipboard!');
    return Promise.resolve();
  }
}

