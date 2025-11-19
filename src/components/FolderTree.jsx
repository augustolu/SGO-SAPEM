import React, { useState } from 'react';
import { Folder as FolderIcon, FolderOpen as FolderOpenIcon, ArrowRight as ArrowRightIcon, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import './FolderTree.css';

const FolderTree = ({ files, onFolderSelect, currentFolderId, rootFolderName }) => {

  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (e, folder) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }));
  };
  
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
          onClick={() => onFolderSelect(node)}
        >
          <span className="tree-arrow" onClick={(e) => toggleFolder(e, node)}>
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
        onClick={() => onFolderSelect({ id: null })}
      >
        <span className="tree-icon" style={{ marginLeft: '24px' }}><FolderIcon /></span>
        <span className="tree-label">{rootFolderName || 'Raíz'}</span>
      </div>
      {files.map(node => renderNode(node, 0))}
    </div>
  );
};

export default FolderTree;
