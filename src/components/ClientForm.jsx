// Component for client form
import React from 'react';

const ClientForm = ({ client, onChange }) => {
  return (
    <div className="form-section">
      <h2>Datos del Cliente</h2>
      <label>Nombre
        <input type="text" name="nombre" value={client.nombre} onChange={onChange} required minLength={3} maxLength={60} />
      </label>
      <label>Dirección
        <input type="text" name="direccion" value={client.direccion} onChange={onChange} required minLength={5} maxLength={100} />
      </label>
      <label>RUC/DNI
        <input type="text" name="ruc" value={client.ruc} onChange={onChange} required pattern="[0-9]{8,11}" title="Debe ser un número de 8 a 11 dígitos" />
      </label>
    </div>
  );
};

export default ClientForm;
