import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageUpload.css';

// --- Helper para obtener la imagen recortada --- //
function getCroppedImg(image, crop, fileName) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0, 0, crop.width, crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(blob => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      blob.name = fileName;
      resolve(blob);
    }, 'image/jpeg', 1);
  });
}

const ImageUpload = ({ onFileSelect, selectedFile }) => {
  const [source, setSource] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const aspect = 16 / 9;

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setSource(reader.result.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e) => {
    imageRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
      width, height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  };

  const handleConfirmCrop = async () => {
    if (imageRef.current && completedCrop) {
      const croppedImageBlob = await getCroppedImg(imageRef.current, completedCrop, 'cropped_image.jpeg');
      onFileSelect(croppedImageBlob);
      setSource(null); // Ocultar el cropper y mostrar la preview
    }
  };

  const handleCancel = () => {
    setSource(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePreview = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  // Si hay una imagen fuente, mostramos el cropper
  if (source) {
    return (
      <div className="image-upload-widget">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
          className="image-cropper"
        >
          <img ref={imageRef} src={source} onLoad={onImageLoad} alt="Recortar imagen" />
        </ReactCrop>
        <div className="crop-actions">
          <button type="button" className="btn-secondary" onClick={handleCancel}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={handleConfirmCrop}>Confirmar Recorte</button>
        </div>
      </div>
    );
  }

  // Si hay un archivo seleccionado (ya recortado), mostramos la vista previa
  if (selectedFile) {
    return (
      <div className="image-upload-widget">
        <div className="image-preview-container">
          <img 
            src={URL.createObjectURL(selectedFile)} 
            alt="Vista previa" 
            className="image-preview"
          />
          <button type="button" onClick={handleRemovePreview} className="remove-image-btn">×</button>
        </div>
      </div>
    );
  }

  // Estado inicial: botón para seleccionar archivo
  return (
    <div className="image-upload-widget">
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            accept="image/png, image/jpeg, image/gif" 
            className="hidden-input"
        />
        <button 
            type="button" 
            className="btn-select-image"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-photo-up" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 8h.01" /><path d="M12.5 21h-6.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6.5" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l3.5 3.5" /><path d="M14 14l1 -1c.67 -.644 1.45 -.824 2.182 -.54" /><path d="M19 22v-6" /><path d="M22 19l-3 -3l-3 3" /></svg>
          <span>Subir Imagen</span>
        </button>
        <p className="upload-hint">Relación de aspecto 16:9</p>
    </div>
  );
};

export default ImageUpload;