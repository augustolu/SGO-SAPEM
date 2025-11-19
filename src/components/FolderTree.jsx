import React, { useState, useEffect } from 'react';
import { Folder as FolderIcon, FolderOpen as FolderOpenIcon, ArrowRight as ArrowRightIcon, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import './FolderTree.css';

const FolderTree = ({ files, onFolderSelect, currentFolderId }) => {

  const [expandedFolders, setExpandedFolders] = useState({});

  // Función para obtener la ruta de IDs de una carpeta
  const getFolderPathIds = (nodes, folderId) => {
    const findPath = (currentNodes, id, currentPath) => {
      for (const node of currentNodes) {
        const newPath = [...currentPath, node.id];
        if (node.id === id) {
          return newPath;
        }
        if (node.children) {
          const foundPath = findPath(node.children, id, newPath);
          if (foundPath) return foundPath;
        }
      }
      return null;
    };
    return findPath(nodes, folderId, []) || [];
  };

  const toggleFolder = (e, folderId) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleFolderClick = (e, folder) => {
    e.stopPropagation();
    onFolderSelect(folder);
    // Auto-expand when selected
    if (!expandedFolders[folder.id]) {
        toggleFolder(e, folder.id);
    }
  };

  // Efecto para expandir automáticamente el árbol al cambiar la carpeta actual
  useEffect(() => {
    if (currentFolderId) {
      const pathIds = getFolderPathIds(files, currentFolderId);
      const newExpanded = { ...expandedFolders };
      pathIds.forEach(id => {
        newExpanded[id] = true;
      });
      setExpandedFolders(newExpanded);
    }
  }, [currentFolderId, files]);
  
  const renderNode = (node, level) => {
    const isFolder = node.tipo === 'folder';
    if (!isFolder) return null;

    const isExpanded = !!expandedFolders[node.id];
    const isActive = node.id === currentFolderId;

    return (
      <div key={node.id} className="tree-node-container">
        <div 
          className={`tree-node ${isActive ? 'active' : ''}`} 
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={(e) => handleFolderClick(e, node)}
        >
          <span className="tree-arrow" onClick={(e) => toggleFolder(e, node.id)}>
            {node.children && node.children.some(c => c.tipo === 'folder') ? (isExpanded ? <ArrowDropDownIcon /> : <ArrowRightIcon />) : <span className="tree-arrow-placeholder"></span>}
          </span>
          <span className="tree-icon">
            {isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
          </span>
          <span className="tree-label">{node.nombre_original}</span>
        </div>
        {isExpanded && node.children && (
          <div className="tree-children">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="folder-tree-container">
      <div 
        className={`tree-node ${currentFolderId === null ? 'active' : ''}`}
        onClick={() => onFolderSelect(null)}
      >
        <span className="tree-icon" style={{ marginLeft: '24px' }}><FolderIcon /></span>
        <span className="tree-label">Raíz</span>
      </div>
      {files.map(node => renderNode(node, 0))}
    </div>
  );
};

export default FolderTree;
