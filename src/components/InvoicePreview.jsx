// Component for invoice/quote preview
import React from 'react';

const InvoicePreview = ({ client, items, subtotal, igv, total, currencySymbol, codigo }) => {
  return (
    <div className="invoice-preview">
      <h2>Vista Previa</h2>
      <div className="client-info">
        <strong>Cliente:</strong> {client.nombre} <br />
        <strong>Dirección:</strong> {client.direccion} <br />
        <strong>RUC/DNI:</strong> {client.ruc}<br />
        {codigo && (<><strong>Código de Factura:</strong> {codigo}<br /></>)}
      </div>
      <table className="items-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th>Precio Unitario (con IGV)</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.nombre}</td>
              <td>{item.cantidad}</td>
              <td>{currencySymbol} {Number(item.precio).toFixed(2)}</td>
              <td>{currencySymbol} {(item.cantidad * item.precio).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="totals">
        <div>Subtotal (sin IGV): <strong>{currencySymbol} {(subtotal - igv).toFixed(2)}</strong></div>
        <div>IGV (18% incluido): <strong>{currencySymbol} {igv.toFixed(2)}</strong></div>
        <div>Total: <strong>{currencySymbol} {total.toFixed(2)}</strong></div>
      </div>
    </div>
  );
};

export default InvoicePreview;
