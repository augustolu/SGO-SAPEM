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
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleConfirmCrop}>Confirmar Recorte</button>
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
            Seleccionar Imagen
        </button>
        
    </div>
  );
};

export default ImageUpload;
