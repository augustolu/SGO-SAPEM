import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import FolderTree from './FolderTree';
import './FileManager.css';

// Material-UI Icons
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
    return <ImageIcon className="fm-item-icon image" />;
  }
  if (extension === 'pdf') {
    return <PdfIcon className="fm-item-icon pdf" />;
  }
  if (['doc', 'docx', 'txt'].includes(extension)) {
    return <DocIcon className="fm-item-icon doc" />;
  }
  return <FileIcon className="fm-item-icon" />;
};

const FileManager = ({ obra_id }) => {
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [obra, setObra] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [inlineName, setInlineName] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  useEffect(() => {
    const fetchObraDetails = async () => {
      if (!obra_id) return;
      try {
        const response = await api.get(`/obras/${obra_id}`);
        setObra(response.data);
      } catch (error) {
        console.error("Error fetching obra details:", error);
      }
    };
    fetchObraDetails();
  }, [obra_id]);

  const fetchFiles = useCallback(async () => {
    if (!obra_id) return;
    setLoading(true);
    try {
      const response = await api.get(`/obras/${obra_id}/archivos`);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  }, [obra_id]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const formData = new FormData();
    acceptedFiles.forEach(file => formData.append('files', file));
    formData.append('parent_id', currentFolderId || '');

    try {
      await api.post(`/obras/${obra_id}/archivos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchFiles();
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  }, [obra_id, currentFolderId, fetchFiles]);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleBeginCreateFolder = () => {
    setEditingItemId(null); // Cancel any other editing
    setIsCreatingFolder(true);
    setInlineName('');
  };

  const handleSaveNewFolder = async () => {
    if (!inlineName.trim()) return;
    try {
      await api.post(`/obras/${obra_id}/archivos/folder`, {
        nombre: inlineName,
        parent_id: currentFolderId,
      });
      fetchFiles();
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setIsCreatingFolder(false);
      setInlineName('');
    }
  };

  const handleBeginEdit = (item) => {
    setIsCreatingFolder(false); // Cancel any creation
    setEditingItemId(item.id);
    setInlineName(item.nombre_original);
  };

  const handleSaveRename = async () => {
    if (!inlineName.trim() || !editingItemId) return;
    try {
      await api.put(`/archivos/${editingItemId}`, { nombre: inlineName });
      fetchFiles();
    } catch (error) {
      console.error("Error renaming item:", error);
    } finally {
      setEditingItemId(null);
      setInlineName('');
    }
  };

  const handleCancelEdit = () => {
    setIsCreatingFolder(false);
    setEditingItemId(null);
    setInlineName('');
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Está seguro de que desea eliminar este elemento y todo su contenido?')) {
      try {
        await api.delete(`/archivos/${id}`);
        fetchFiles();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const handleFolderSelect = (folder) => {
    handleCancelEdit();
    if (folder === null || folder.id === null) {
      setCurrentFolderId(null);
    } else {
      setCurrentFolderId(folder.id);
    }
  };

  const displayedFiles = useMemo(() => {
    let filesToShow = [];
    if (currentFolderId === null) {
      filesToShow = files;
    } else {
      const findFolder = (nodes, id) => {
        for (const node of nodes) {
          if (node.id === id) return node.children || [];
          if (node.children) {
            const found = findFolder(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      filesToShow = findFolder(files, currentFolderId) || [];
    }
    return filesToShow;
  }, [files, currentFolderId]);

  const getPath = (nodes, folderId) => {
    if (folderId === null) return [];
    const path = [];
    const findPath = (nodes, id, currentPath) => {
        for (const node of nodes) {
            if (node.id === id) {
                return [...currentPath, node];
            }
            if (node.children) {
                const foundPath = findPath(node.children, id, [...currentPath, node]);
                if (foundPath) return foundPath;
            }
        }
        return null;
    };
    return findPath(nodes, folderId, []) || [];
  };

  const breadcrumbPath = useMemo(() => getPath(files, currentFolderId), [files, currentFolderId]);

  const renderNode = (node) => {
    const isEditing = editingItemId === node.id;

    if (isEditing) {
      return (
        <div key={node.id} className="fm-list-item inline-edit">
          <div className="fm-item-name">
            {node.tipo === 'folder' ? <FolderIcon className="fm-item-icon folder" /> : getFileIcon(node.nombre_original)}
            <input 
              type="text"
              value={inlineName}
              onChange={(e) => setInlineName(e.target.value)}
              autoFocus
              maxLength="15"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
            />
          </div>
          <div className="fm-item-actions">
            <button onClick={handleSaveRename} className="fm-action-btn save"><SaveIcon fontSize="small" /></button>
            <button onClick={handleCancelEdit} className="fm-action-btn cancel"><CancelIcon fontSize="small" /></button>
          </div>
        </div>
      );
    }

    return (
      <div key={node.id} className="fm-list-item" onDoubleClick={() => node.tipo === 'folder' && handleFolderSelect(node)}>
        <div className="fm-item-name">
          {node.tipo === 'folder' ? <FolderIcon className="fm-item-icon folder" /> : getFileIcon(node.nombre_original)}          
          <a 
            href={node.tipo !== 'folder' ? `${import.meta.env.VITE_API_URL || ''}${node.ruta_archivo}` : undefined} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={(e) => { if (node.tipo === 'folder') e.preventDefault(); else e.stopPropagation(); }}
          >
            {node.nombre_original}
          </a>
        </div>
        <div className="fm-item-actions">
          <button onClick={() => handleBeginEdit(node)} className="fm-action-btn edit"><EditIcon fontSize="small" /></button>
          <button onClick={(e) => handleDelete(e, node.id)} className="fm-action-btn delete"><DeleteIcon fontSize="small" /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="file-manager-container">
      <div className="fm-body">
        {isSidebarVisible && (
          <div className="fm-sidebar">
            <FolderTree 
              files={files} 
              onFolderSelect={handleFolderSelect} 
              currentFolderId={currentFolderId}
              rootFolderName={obra ? `sapem - ${obra.numero_gestion}` : 'sapem'}
            />
          </div>
        )}

        <div className={`fm-main-content ${!isSidebarVisible ? 'full-width' : ''}`} {...getRootProps()}>
          <button 
            onClick={() => setIsSidebarVisible(!isSidebarVisible)} 
            className={`fm-sidebar-toggle ${isSidebarVisible ? 'open' : ''}`}
            title={isSidebarVisible ? 'Ocultar árbol' : 'Mostrar árbol'}
          >
            <div className="fm-sidebar-toggle-arrow"></div>
          </button>

          <input {...getInputProps()} />
          
          <div className="fm-top-bar">
            <div className="fm-breadcrumbs">
              <span onClick={() => handleFolderSelect(null)} className="breadcrumb-item">
                {obra ? `sapem - ${obra.numero_gestion}` : 'sapem'}
              </span>
              {breadcrumbPath.map(folder => (
                <React.Fragment key={folder.id}>
                  <span className="breadcrumb-separator">/</span>
                  <span onClick={() => handleFolderSelect(folder)} className="breadcrumb-item">
                    {folder.nombre_original}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <div className="fm-actions">
              <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className="fm-button" title="Añadir" disabled={isCreatingFolder || editingItemId !== null}>
                <AddCircleOutlineIcon />
              </button>
              {isAddMenuOpen && (
                <div className="fm-add-menu">
                  <button onClick={() => { handleBeginCreateFolder(); setIsAddMenuOpen(false); }}>
                    <FolderIcon fontSize="small" />
                    Crear Carpeta
                  </button>
                  <button onClick={() => { openFileDialog(); setIsAddMenuOpen(false); }}>
                    <CloudUploadIcon fontSize="small" />
                    Subir Archivo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="fm-list-header">
            <span>Nombre</span>
          </div>

          <div className="fm-list-container">
            {isDragActive && (
              <div className="fm-dropzone-overlay">
                <CloudUploadIcon style={{ fontSize: 60 }} />
                <p>Suelte los archivos aquí para subirlos</p>
              </div>
            )}
            
            {isCreatingFolder && (
              <div className="fm-list-item inline-edit">
                <div className="fm-item-name">
                  <FolderIcon className="fm-item-icon folder" />
                  <input 
                    type="text"
                    value={inlineName}
                    onChange={(e) => setInlineName(e.target.value)}
                    autoFocus
                    maxLength="15"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNewFolder()}
                  />
                </div>
                <div className="fm-item-actions">
                  <button onClick={handleSaveNewFolder} className="fm-action-btn save"><SaveIcon fontSize="small" /></button>
                  <button onClick={handleCancelEdit} className="fm-action-btn cancel"><CancelIcon fontSize="small" /></button>
                </div>
              </div>
            )}

            {loading ? <p>Cargando...</p> : (
              (displayedFiles && displayedFiles.length > 0) ?
                displayedFiles.map(renderNode)
                : !isCreatingFolder && (
                  <div className="fm-empty-folder">
                    <FolderIcon style={{ fontSize: 80, color: '#ccc' }} />
                    <h3>Carpeta Vacía</h3>
                    <p>Arrastra archivos aquí o usa el botón + para empezar.</p>
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
