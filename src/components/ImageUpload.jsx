import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { 
  Slider, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Close, ZoomIn, RotateRight } from '@mui/icons-material';
import getCroppedImg from '../utils/cropImage';
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
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setOpenCropDialog(true);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    try {
      if (!croppedAreaPixels) return;

      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const fileName = selectedFile?.name || `cropped-${Date.now()}.jpg`;
      const croppedFile = new File([blob], fileName, { type: selectedFile?.type || 'image/jpeg' });

      onFileSelect(croppedFile);
      setOpenCropDialog(false);
      setIsCropping(false);
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsCropping(false);
    }
  };

  const handleCancelCrop = () => {
    setOpenCropDialog(false);
    setIsCropping(false);
    setImageSrc(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetControls = () => {
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  };

  const handleReCrop = () => {
    if (selectedFile) {
      setImageSrc(URL.createObjectURL(selectedFile));
      setOpenCropDialog(true);
      setIsCropping(true);
      resetControls();
    }
  };

  return (
    <div className="image-upload">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="image-upload__input"
        id="image-upload-input"
        ref={fileInputRef}
      />
      
      <label htmlFor="image-upload-input" className="image-upload__label">
        <div className="image-upload__trigger">
          <span className="image-upload__text">
            {selectedFile ? selectedFile.name : 'Seleccionar imagen'}
          </span>
        </div>
      </label>

      {selectedFile && !openCropDialog && (
        <div className="image-preview">
          <img 
            src={URL.createObjectURL(selectedFile)} 
            alt="Preview" 
            className="image-preview__image" 
          />
          <Button 
            onClick={handleReCrop}
            className="image-preview__crop-btn"
            startIcon={<ZoomIn />}
          >
            Recortar
          </Button>
        </div>
      )}

      <Dialog 
        open={openCropDialog} 
        onClose={handleCancelCrop} 
        maxWidth="lg" 
        fullWidth
        className="crop-dialog"
      >
        <DialogTitle className="crop-dialog__title">
          <Typography variant="h6" component="span">
            Recortar imagen
          </Typography>
          <IconButton onClick={handleCancelCrop} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent className="crop-dialog__content">
          <div className="cropper-wrapper">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                classes={{
                  containerClassName: 'cropper__container',
                  mediaClassName: 'cropper__media',
                }}
              />
            )}
          </div>
          
          <Box className="controls">
            <div className="control-group">
              <div className="control-label">
                <ZoomIn fontSize="small" />
                <Typography variant="body2">Zoom</Typography>
              </div>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e, value) => setZoom(value)}
                className="control-slider"
              />
              <Typography variant="caption" className="control-value">
                {zoom.toFixed(1)}x
              </Typography>
            </div>
            
            <div className="control-group">
              <div className="control-label">
                <RotateRight fontSize="small" />
                <Typography variant="body2">Rotación</Typography>
              </div>
              <Slider
                value={rotation}
                min={0}
                max={360}
                step={1}
                onChange={(e, value) => setRotation(value)}
                className="control-slider"
              />
              <Typography variant="caption" className="control-value">
                {rotation}°
              </Typography>
            </div>
          </Box>
        </DialogContent>
        
        <DialogActions className="crop-dialog__actions">
          <Button onClick={handleCancelCrop} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleCrop} 
            variant="contained" 
            className="crop-confirm-btn"
          >
            Aplicar recorte
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ImageUpload;