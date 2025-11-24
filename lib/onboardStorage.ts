/**
 * Utility functions for saving and loading OnboardWizard data from localStorage
 */

const STORAGE_KEY = 'onboard-wizard-data';

interface SavedFile {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
}

interface SavedWizardData {
  step: 'sources' | 'add-website' | 'add-documents' | 'settings' | 'finalize';
  websiteSources: Array<{ url: string; followLink: boolean }>;
  uploadedFiles: SavedFile[];
  agentSettings: {
    name: string;
    personaPrompt: string;
    allowedDomains: string[];
    isPublic: boolean;
  };
  currentWebsiteUrl: string;
  currentFollowLink: boolean;
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/png;base64,)
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 string back to File
 */
function base64ToFile(savedFile: SavedFile): File {
  const byteCharacters = atob(savedFile.data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: savedFile.type });
  return new File([blob], savedFile.name, { type: savedFile.type });
}

/**
 * Save wizard data to localStorage
 */
export async function saveWizardData(data: {
  step: 'sources' | 'add-website' | 'add-documents' | 'settings' | 'finalize';
  websiteSources: Array<{ url: string; followLink: boolean }>;
  uploadedFiles: File[];
  agentSettings: {
    name: string;
    personaPrompt: string;
    allowedDomains: string[];
    isPublic: boolean;
  };
  currentWebsiteUrl: string;
  currentFollowLink: boolean;
}): Promise<void> {
  try {
    // Convert files to base64 (skip files larger than 5MB to avoid localStorage limits)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const savedFiles: SavedFile[] = await Promise.all(
      data.uploadedFiles
        .filter((file) => file.size <= MAX_FILE_SIZE)
        .map(async (file) => {
          const base64 = await fileToBase64(file);
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
          };
        })
    );

    // Warn if some files were skipped
    const skippedFiles = data.uploadedFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (skippedFiles.length > 0) {
      console.warn(
        `Skipped saving ${skippedFiles.length} file(s) larger than 5MB:`,
        skippedFiles.map((f) => f.name)
      );
    }

    const savedData: SavedWizardData = {
      step: data.step,
      websiteSources: data.websiteSources,
      uploadedFiles: savedFiles,
      agentSettings: data.agentSettings,
      currentWebsiteUrl: data.currentWebsiteUrl,
      currentFollowLink: data.currentFollowLink,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
  } catch (error) {
    console.error('Error saving wizard data:', error);
    // Don't throw - allow form to continue working even if save fails
  }
}

/**
 * Load wizard data from localStorage
 */
export function loadWizardData(): {
  step: 'sources' | 'add-website' | 'add-documents' | 'settings' | 'finalize';
  websiteSources: Array<{ url: string; followLink: boolean }>;
  uploadedFiles: File[];
  agentSettings: {
    name: string;
    personaPrompt: string;
    allowedDomains: string[];
    isPublic: boolean;
  };
  currentWebsiteUrl: string;
  currentFollowLink: boolean;
} | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const savedData: SavedWizardData = JSON.parse(saved);

    // Convert base64 files back to File objects
    const uploadedFiles = savedData.uploadedFiles.map(base64ToFile);

    return {
      step: savedData.step,
      websiteSources: savedData.websiteSources,
      uploadedFiles,
      agentSettings: savedData.agentSettings,
      currentWebsiteUrl: savedData.currentWebsiteUrl,
      currentFollowLink: savedData.currentFollowLink,
    };
  } catch (error) {
    console.error('Error loading wizard data:', error);
    return null;
  }
}

/**
 * Clear saved wizard data (call after successful creation)
 */
export function clearWizardData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing wizard data:', error);
  }
}

