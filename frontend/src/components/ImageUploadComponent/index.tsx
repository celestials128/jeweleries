import { useState, useRef } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { toast } from 'react-toastify';
import './ImageUploadComponent.css';

interface ImageUploadComponentProps {
  onUploadSuccess?: (url: string) => void;
  directory?: string;
}

export const ImageUploadComponent = ({ 
  onUploadSuccess, 
  directory = 'products' 
}: ImageUploadComponentProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const { uploadFile, loading, error } = useFileUpload();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      const result = await uploadFile(file, directory);
      setUploadedUrl(result.url);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess?.(result.url);
      toast.success('Image uploaded successfully.');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed. Please try again.');
    }
  };

  return (
    <div className="image-upload-container">
      <div className="upload-area">
        <h3>Upload Image</h3>
        
        <div className="file-input-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
          <label>Select Image</label>
        </div>

        {error && <div className="error-message">{error}</div>}

        {preview && (
          <div className="preview-section">
            <img src={preview} alt="Preview" className="preview-image" />
            <button 
              onClick={handleUpload} 
              disabled={loading}
              className="upload-button"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        )}

        {uploadedUrl && (
          <div className="uploaded-section">
            <p className="success-message">✅ Upload successful!</p>
            <img src={uploadedUrl} alt="Uploaded" className="uploaded-image" />
            <p className="file-url">{uploadedUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
};
