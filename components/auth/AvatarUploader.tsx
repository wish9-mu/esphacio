'use client';

import imageCompression from 'browser-image-compression';
import { useEffect, useRef, useState } from 'react';

export default function AvatarUploader({ onChange }: { onChange: (file: File | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);

  async function selectFile(file: File | undefined) {
    if (!file) return;
    setMessage('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Images must be 10 MB or smaller.');
      return;
    }
    setBusy(true);
    try {
      let compressed: File;
      try {
        compressed = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 512, useWebWorker: true, fileType: 'image/webp', initialQuality: 0.8 });
      } catch {
        compressed = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 512, useWebWorker: true, fileType: 'image/jpeg', initialQuality: 0.8 });
      }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(compressed);
      setPreview(objectUrl.current);
      setMessage(`${(file.size / 1024 / 1024).toFixed(1)} MB -> ${(compressed.size / 1024).toFixed(0)} KB`);
      onChange(compressed);
    } catch {
      setMessage('We could not compress that image. You can continue without a photo.');
      onChange(null);
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setPreview(null);
    setMessage('');
    onChange(null);
  }

  return (
    <div className="avatar-uploader">
      <span className="form-label">Profile photo <small>(optional)</small></span>
      <div className="avatar-uploader-row">
        {preview ? <img className="avatar-preview" src={preview} alt="Profile preview" /> : <span className="avatar-placeholder" aria-hidden="true">+</span>}
        <div>
          <label className="button ghost avatar-file-button">
            {busy ? 'Compressing…' : preview ? 'Change photo' : 'Choose photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void selectFile(event.target.files?.[0])} disabled={busy} />
          </label>
          {preview && <button className="link-btn avatar-remove" type="button" onClick={remove}>Remove</button>}
          {message && <p className="small muted" aria-live="polite">{message}</p>}
        </div>
      </div>
    </div>
  );
}
