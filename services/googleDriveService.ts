// Declare GAPI global variable - Kept for potential future non-upload uses, but not for upload auth
// This is loaded from <script> tags in index.html
declare const gapi: any; 

// Minimal type definitions for Google Identity Services - Kept for potential future non-upload uses
declare global {
    namespace google {
        namespace accounts {
            namespace oauth2 {
                interface TokenResponse {
                    access_token: string;
                    error?: any; 
                    [key: string]: any; 
                }

                interface TokenClientConfig {
                    client_id: string;
                    scope: string;
                    callback: (resp: TokenResponse) => void;
                }

                interface TokenClient {
                    requestAccessToken: (overrideConfig?: {prompt?: string}) => void;
                    callback?: (resp: TokenResponse) => void; 
                }
                
                function initTokenClient(config: TokenClientConfig): TokenClient;
                function revoke(token: string, callback: () => void): void;
            }
        }
    }
}


import { UUID } from '../types';

// --- Configuration for Local Service Account Uploader ---
const LOCAL_UPLOADER_ENDPOINT = 'http://localhost:3001/upload-local'; // Matches port in localDriveUploader.js
// --- End Configuration ---

interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number; 
  webViewLink: string;
  downloadLink?: string; 
}

type UploadModule = 'vanban' | 'vanbandulich';

export const googleDriveService = {
  // This flag is now effectively always true for the service's upload logic
  isLocalUploaderEnabled: () => true, 
  
  // ensureInitialized, isSignedIn, requestAccessToken, signOut, getAppFolderIdClientSide
  // are removed as they pertain to client-side OAuth flow which is no longer used for uploads.
  // If other GAPI features were to be used (e.g., file picking, not implemented),
  // a separate initialization for those might be needed. For now, KISS.

  // --- File Upload via Local Service Account (Now the ONLY method) ---
  uploadFileViaLocalService: async (file: File, _documentIdForLog?: UUID, module: UploadModule = 'vanban'): Promise<DriveFileMetadata> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);

    try {
      console.log(`Uploading ${file.name} to local service at ${LOCAL_UPLOADER_ENDPOINT} (module: ${module})`);
      const response = await fetch(LOCAL_UPLOADER_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Local uploader server Error:', errorBody);
        throw new Error(`Upload via local server failed: ${response.statusText} - ${errorBody}`);
      }
      const uploadedFile: DriveFileMetadata = await response.json();
      return uploadedFile;
    } catch (error) {
      console.error("Error uploading file via local service:", error);
      throw error;
    }
  },

  // --- Unified File Upload Method (Now simplified) ---
  uploadFile: async (file: File, documentId: UUID, module: UploadModule = 'vanban'): Promise<DriveFileMetadata> => {
    return googleDriveService.uploadFileViaLocalService(file, documentId, module);
  },
};
