// Component for product/service items
import React from 'react';

const ItemForm = ({ items, onItemChange, onAddItem, onRemoveItem }) => {
  return (
    <div className="form-section">
      <h2>Productos o Servicios</h2>
      {items.map((item, idx) => (
        <div key={idx} className="item-row">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={item.nombre}
            onChange={e => onItemChange(idx, 'nombre', e.target.value)}
            required
            minLength={2}
            maxLength={60}
          />
          <input
            type="number"
            name="cantidad"
            placeholder="Cantidad"
            min="1"
            value={item.cantidad}
            onChange={e => onItemChange(idx, 'cantidad', e.target.value)}
            required
          />
          <input
            type="number"
            name="precio"
            placeholder="Precio Unitario"
            min="0.01"
            step="0.01"
            value={item.precio}
            onChange={e => onItemChange(idx, 'precio', e.target.value)}
            required
          />
          <button type="button" onClick={() => onRemoveItem(idx)} className="remove-btn">Eliminar</button>
        </div>
      ))}
      <button type="button" onClick={onAddItem} className="add-btn">Agregar ítem</button>
    </div>
  );
};

export default ItemForm;
