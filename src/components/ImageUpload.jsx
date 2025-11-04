import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import getCroppedImg from '../utils/cropImage'; // We'll create this utility
import './ImageUpload.css';

const ImageUpload = ({ onFileSelect, selectedFile, setIsCropping }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [openCropDialog, setOpenCropDialog] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!selectedFile) {
      setImageSrc(null);
    }
  }, [selectedFile]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setOpenCropDialog(true);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      // Convert base64 to File object
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const croppedFile = new File([blob], selectedFile.name, { type: selectedFile.type });

      onFileSelect(croppedFile);
      setOpenCropDialog(false);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      setIsCropping(false);
    }
  };

  const handleCancelCrop = () => {
    setOpenCropDialog(false);
    setIsCropping(false);
    setImageSrc(null);
    onFileSelect(null); // Clear the selected file if cropping is cancelled
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
  };

  return (
    <div className="image-upload-container">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="file-input"
        id="image-upload-input"
        ref={fileInputRef}
      />
      <label htmlFor="image-upload-input" className="file-input-label">
        {selectedFile ? selectedFile.name : 'Seleccionar Imagen'}
      </label>

      {selectedFile && !openCropDialog && (
        <div className="image-preview-container">
          <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="image-preview" />
          <button onClick={() => {
            setImageSrc(URL.createObjectURL(selectedFile));
            setOpenCropDialog(true);
            setIsCropping(true);
          }} className="re-crop-button">Recortar de Nuevo</button>
        </div>
      )}

      <Dialog open={openCropDialog} onClose={handleCancelCrop} maxWidth="md" fullWidth>
        <DialogTitle>Recortar Imagen</DialogTitle>
        <DialogContent>
          <div className="cropper-container">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={4 / 3} // Adjust aspect ratio as needed
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="controls">
            <label>Zoom:</label>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e, zoom) => setZoom(zoom)}
            />
            <label>Rotación:</label>
            <Slider
              value={rotation}
              min={0}
              max={360}
              step={1}
              aria-labelledby="Rotation"
              onChange={(e, rotation) => setRotation(rotation)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCrop} color="primary">Cancelar</Button>
          <Button onClick={handleCrop} color="primary" variant="contained">Recortar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ImageUpload;
