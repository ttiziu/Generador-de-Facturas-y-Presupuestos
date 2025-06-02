// Main action buttons
import React from 'react';

const MainButtons = ({ onSave, onDownload }) => (
  <div className="main-buttons">
    <button type="button" className="save-btn" onClick={onSave}>Guardar</button>
    <button type="button" className="download-btn" onClick={onDownload}>Descargar PDF</button>
  </div>
);

export default MainButtons;
