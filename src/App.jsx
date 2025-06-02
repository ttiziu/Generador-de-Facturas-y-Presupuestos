import React, { useState, useEffect, useRef } from 'react';
import './styles/global.css';
import ClientForm from './components/ClientForm';
import ItemForm from './components/ItemForm';
import InvoicePreview from './components/InvoicePreview';
import MainButtons from './components/MainButtons';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import gsap from 'gsap';
import Waves from './components/Waves';

function App() {
  // Monedas soportadas
  const currencies = [
    { code: 'PEN', symbol: 'S/', label: 'Soles', rate: 1 },
    { code: 'USD', symbol: '$', label: 'Dólares', rate: 0.27 },
    { code: 'EUR', symbol: '€', label: 'Euros', rate: 0.25 }
  ];
  const [currency, setCurrency] = useState('PEN');
  const selectedCurrency = currencies.find(c => c.code === currency);

  // Estados principales
  const [isLogged, setIsLogged] = useState(() => !!localStorage.getItem('loggedUser'));
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState({ nombre: '', direccion: '', ruc: '' });
  const [items, setItems] = useState([{ nombre: '', cantidad: 1, precio: 0 }]);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [dark, setDark] = useState(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [clientError, setClientError] = useState('');
  const loginRef = useRef(null);
  const mainRef = useRef(null);

  // Cargar historial al iniciar sesión
  useEffect(() => {
    if (isLogged) fetchFacturas();
    // eslint-disable-next-line
  }, [isLogged]);

  // Animación de inicio de sesión con GSAP
  useEffect(() => {
    if (!isLogged && loginRef.current) {
      gsap.fromTo(
        loginRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
      );
    }
    if (isLogged && mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }
      );
    }
  }, [isLogged]);

  // Cambiar tema oscuro/claro
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Login con Firebase
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginData.user, loginData.pass);
      setIsLogged(true);
      localStorage.setItem('loggedUser', loginData.user);
      setLoginError('');
      await fetchFacturas();
    } catch (err) {
      setLoginError('Usuario o contraseña incorrectos');
    }
    setLoading(false);
  };
  const handleLogout = async () => {
    await signOut(auth);
    setIsLogged(false);
    localStorage.removeItem('loggedUser');
    setHistory([]);
  };
  const handleRegister = async () => {
    if (!loginData.user || !loginData.pass) return;
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, loginData.user, loginData.pass);
      alert('Usuario registrado. Ahora puedes iniciar sesión.');
    } catch (err) {
      alert('Error al registrar usuario: ' + err.message);
    }
    setLoading(false);
  };

  // Buscar nombre por RUC/DNI usando APIs públicas con proxy CORS
  const fetchNombrePorDocumento = async (tipo, numero) => {
    const corsProxy = 'https://corsproxy.io/?';
    if (tipo === 'ruc' && numero.length === 11) {
      try {
        const res = await fetch(`${corsProxy}https://api.apis.net.pe/v1/ruc?numero=${numero}`);
        if (!res.ok) return '';
        const data = await res.json();
        return data.nombre || '';
      } catch {
        return '';
      }
    } else if (tipo === 'dni' && numero.length === 8) {
      try {
        const res = await fetch(`${corsProxy}https://api.apis.net.pe/v1/dni?numero=${numero}`);
        if (!res.ok) return '';
        const data = await res.json();
        return data.nombre || '';
      } catch {
        return '';
      }
    }
    return '';
  };

  // Formulario cliente/productos con validaciones
  const handleClientChange = async (e) => {
    const { name, value } = e.target;
    let newClient = { ...client, [name]: value };
    let error = '';
    // Validaciones
    if (name === 'nombre') {
      if (value.length < 3 || value.length > 60) error = 'El nombre debe tener entre 3 y 60 caracteres.';
    }
    if (name === 'direccion') {
      if (value.length < 5 || value.length > 100) error = 'La dirección debe tener entre 5 y 100 caracteres.';
    }
    if (name === 'ruc') {
      if (!/^\d{8,11}$/.test(value)) error = 'El RUC/DNI debe tener entre 8 y 11 dígitos numéricos.';
      let nombre = '';
      if (/^\d{11}$/.test(value)) {
        nombre = await fetchNombrePorDocumento('ruc', value);
        if (!nombre) error = 'No se encontró empresa para este RUC.';
      } else if (/^\d{8}$/.test(value)) {
        nombre = await fetchNombrePorDocumento('dni', value);
        if (!nombre) error = 'No se encontró persona para este DNI.';
      }
      if (nombre) newClient.nombre = nombre;
    }
    setClient(newClient);
    setClientError(error);
  };

  const handleItemChange = (idx, field, value) => {
    const newItems = [...items];
    // Permitir escribir cualquier valor, sin bloquear por longitud
    newItems[idx][field] = field === 'cantidad' || field === 'precio' ? Number(value) : value;
    setItems(newItems);
  };
  const handleAddItem = () => {
    setItems([...items, { nombre: '', cantidad: 1, precio: 0 }]);
  };
  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // Cálculos
  // Ahora los precios de los ítems ya incluyen IGV
  const subtotal = items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0) * selectedCurrency.rate;
  const igv = subtotal - (subtotal / 1.18);
  const total = subtotal;

  // Función para generar un código único de 5 caracteres (letras y números)
  function generarCodigoFactura() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Guardar factura en Firestore
  const handleSave = async () => {
    // Validaciones antes de guardar
    if (!client.nombre || client.nombre.length < 3) {
      alert('El nombre del cliente es obligatorio y debe tener al menos 3 caracteres.');
      return;
    }
    if (!client.direccion || client.direccion.length < 5) {
      alert('La dirección es obligatoria y debe tener al menos 5 caracteres.');
      return;
    }
    if (!/^\d{8,11}$/.test(client.ruc)) {
      alert('El RUC/DNI debe tener entre 8 y 11 dígitos numéricos.');
      return;
    }
    for (const item of items) {
      if (!item.nombre || item.nombre.length < 2) {
        alert('Todos los ítems deben tener nombre (mínimo 2 caracteres).');
        return;
      }
      if (!item.cantidad || item.cantidad < 1) {
        alert('La cantidad de cada ítem debe ser al menos 1.');
        return;
      }
      if (!item.precio || item.precio < 0.01) {
        alert('El precio de cada ítem debe ser mayor a 0.');
        return;
      }
    }
    setLoading(true);
    // Generar código único para la factura
    const codigo = generarCodigoFactura();
    const factura = {
      fecha: new Date().toISOString().slice(0, 10),
      client,
      items,
      subtotal,
      igv,
      total,
      currency: selectedCurrency.code,
      currencySymbol: selectedCurrency.symbol,
      user: auth.currentUser?.email || 'demo',
      codigo // nuevo campo
    };
    try {
      await addDoc(collection(db, 'facturas'), factura);
      alert('Factura guardada en la nube. Código: ' + codigo);
      await fetchFacturas();
    } catch (err) {
      alert('Error al guardar factura: ' + err.message);
    }
    setLoading(false);
  };

  // Leer historial de facturas desde Firestore
  const fetchFacturas = async () => {
    setLoading(true);
    try {
      // Si el usuario está autenticado, buscar por su email. Si no, traer todas las facturas demo
      let q;
      if (auth.currentUser && auth.currentUser.email) {
        q = query(collection(db, 'facturas'), where('user', '==', auth.currentUser.email), orderBy('fecha', 'desc'));
      } else {
        q = query(collection(db, 'facturas'), where('user', '==', 'demo'), orderBy('fecha', 'desc'));
      }
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    } catch (err) {
      setHistory([]);
    }
    setLoading(false);
  };

  // Descargar PDF
  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Factura / Presupuesto', 15, 15);
    doc.setFontSize(12);
    // Mostrar el código de la factura seleccionada si existe, si no, mostrar el último
    let codigoFactura = undefined;
    if (selectedFactura && selectedFactura.codigo) {
      codigoFactura = selectedFactura.codigo;
    } else if (history.length > 0 && history[0]?.codigo) {
      codigoFactura = history[0].codigo;
    }
    if (codigoFactura) {
      doc.text(`Código de Factura: ${codigoFactura}`, 15, 22);
    }
    let y = codigoFactura ? 30 : 30; // Ajustar posición si hay código
    doc.text(`Cliente: ${client.nombre}`, 15, y);
    doc.text(`Dirección: ${client.direccion}`, 15, y + 8);
    doc.text(`RUC/DNI: ${client.ruc}`, 15, y + 16);
    doc.text('------------------------------------------', 15, y + 24);
    y = y + 32;
    doc.text('Ítems:', 15, y);
    y += 8;
    items.forEach((item, idx) => {
      doc.text(
        `${idx + 1}. ${item.nombre} | Cant: ${item.cantidad} | P.Unit: ${selectedCurrency.symbol} ${Number(item.precio * selectedCurrency.rate).toFixed(2)} | Total: ${selectedCurrency.symbol} ${(item.cantidad * item.precio * selectedCurrency.rate).toFixed(2)}`,
        15,
        y
      );
      y += 8;
    });
    y += 4;
    doc.text('------------------------------------------', 15, y);
    y += 8;
    doc.text(`Subtotal: ${selectedCurrency.symbol} ${subtotal.toFixed(2)}`, 15, y);
    y += 8;
    doc.text(`IGV (18%): ${selectedCurrency.symbol} ${igv.toFixed(2)}`, 15, y);
    y += 8;
    doc.text(`Total: ${selectedCurrency.symbol} ${total.toFixed(2)}`, 15, y);
    doc.save('factura.pdf');
  };

  // Búsqueda de facturas
  const filteredHistory = history.filter(f => {
    const searchLower = search.toLowerCase();
    return (
      (f.client?.nombre && f.client.nombre.toLowerCase().includes(searchLower)) ||
      (f.fecha && f.fecha.includes(searchLower)) ||
      (f.codigo && f.codigo.toLowerCase().includes(searchLower))
    );
  });

  // Loading
  if (loading) return <div className="app-container"><h2>Cargando...</h2></div>;

  // Login
  if (!isLogged) {
    return (
      <div ref={loginRef} className="login-container">
        <Waves
          lineColor="#fff"
          backgroundColor="rgba(123,31,162,0.12)"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
          style={{zIndex: 0}}
        />
        <div className="login-card" style={{zIndex: 2, position: 'relative'}}>
          <h1 className="login-title">Acceso a Facturación</h1>
          <form onSubmit={handleLogin} className="form-section login-form">
            <label>Usuario (email)
              <input type="email" value={loginData.user} onChange={e => setLoginData({ ...loginData, user: e.target.value })} required />
            </label>
            <label>Contraseña
              <input type="password" value={loginData.pass} onChange={e => setLoginData({ ...loginData, pass: e.target.value })} required />
            </label>
            <div className="login-btns">
              <button type="submit" className="save-btn">Ingresar</button>
              <button type="button" className="add-btn" onClick={handleRegister}>Registrarse</button>
            </div>
            {loginError && <div className="login-error">{loginError}</div>}
          </form>
        </div>
        <div className="login-bg-anim"></div>
      </div>
    );
  }

  // Cargar datos de factura seleccionada en el formulario para editar
  const handleLoadFacturaToForm = () => {
    if (!selectedFactura) return;
    setClient(selectedFactura.client);
    setItems(selectedFactura.items);
    setCurrency(selectedFactura.currency);
    setSelectedFactura(null);
  };

  // Página principal
  return (
    <div style={{position:'relative', minHeight:'100vh', width:'100vw', overflowX:'hidden', overflowY:'visible'}}>
      <Waves
        lineColor="#fff"
        backgroundColor="rgba(123,31,162,0.12)"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
        style={{zIndex: 0, position:'fixed', top:0, left:0, width:'100vw', height:'100vh', minHeight:'100vh', pointerEvents:'none'}}
      />
      <div ref={mainRef} className="app-container main-anim" style={{zIndex:2, position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h1 className="shiny-text">Generador de Facturas y Presupuestos</h1>
          <button onClick={handleLogout} className="remove-btn" style={{marginLeft:'1rem'}}>Cerrar sesión</button>
        </div>
        <div style={{marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div>
            <label style={{fontWeight:500, color: 'var(--primary)'}}>Moneda:
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.3rem',
                  borderRadius: '5px',
                  background: 'var(--input-bg)',
                  color: 'var(--text)',
                  border: '1.5px solid var(--input-border)',
                  transition: 'background 0.3s, color 0.3s, border 0.3s'
                }}
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code} style={{color: 'var(--text)', background: 'var(--input-bg)'}}>
                    {c.label} ({c.code})
                  </option>
                ))}
              </select>
            </label>
            <span style={{marginLeft:'1rem',color:'var(--primary)',fontWeight:500}}>{selectedCurrency.label}</span>
          </div>
          <button onClick={()=>setDark(d=>!d)} className="add-btn" style={{minWidth:90}}>
            {dark ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
        </div>
        <ClientForm client={client} onChange={handleClientChange} />
        {clientError && <div style={{color:'var(--error)',marginBottom:'1rem',fontWeight:500}}>{clientError}</div>}
        <ItemForm items={items} onItemChange={handleItemChange} onAddItem={handleAddItem} onRemoveItem={handleRemoveItem} />
        <InvoicePreview 
          client={client} 
          items={items} 
          subtotal={subtotal} 
          igv={igv} 
          total={total} 
          currencySymbol={selectedCurrency.symbol} 
          codigo={history.length > 0 ? history[0].codigo : undefined}
        />
        <MainButtons onSave={handleSave} onDownload={handleDownload} />
        <div className="form-section">
          <h2>Historial de Facturas</h2>
          <input
            type="text"
            placeholder="Buscar por cliente, fecha o código"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: '1rem', width: '100%' }}
          />
          <ul>
            {filteredHistory.length === 0 && <li>No hay facturas encontradas.</li>}
            {filteredHistory.map(f => (
              <li key={f.id} style={{ marginBottom: '0.5rem', cursor:'pointer' }} onClick={() => setSelectedFactura(f)}>
                <strong>{f.fecha}</strong> - {f.client.nombre} - Código: <b>{f.codigo || 'N/A'}</b> - Total: {currencies.find(c => c.code === f.currency)?.symbol || f.currencySymbol} {f.total.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
        {/* Modal de detalle de factura */}
        {selectedFactura && (
          <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.25)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={()=>setSelectedFactura(null)}>
            <div style={{background:'#fff',padding:'2rem',borderRadius:'10px',minWidth:'350px',maxWidth:'95vw',boxShadow:'0 2px 16px rgba(0,0,0,0.15)'}} onClick={e=>e.stopPropagation()}>
              <h2>Detalle de Factura</h2>
              <div><b>Fecha:</b> {selectedFactura.fecha}</div>
              <div><b>Cliente:</b> {selectedFactura.client.nombre}</div>
              <div><b>Dirección:</b> {selectedFactura.client.direccion}</div>
              <div><b>RUC/DNI:</b> {selectedFactura.client.ruc}</div>
              <table className="items-table" style={{marginTop:'1rem'}}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFactura.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>{selectedFactura.currencySymbol} {Number(item.precio * currencies.find(c => c.code === selectedFactura.currency).rate).toFixed(2)}</td>
                      <td>{selectedFactura.currencySymbol} {(item.cantidad * item.precio * currencies.find(c => c.code === selectedFactura.currency).rate).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="totals">
                <div>Subtotal: <strong>{selectedFactura.currencySymbol} {selectedFactura.subtotal.toFixed(2)}</strong></div>
                <div>IGV (18%): <strong>{selectedFactura.currencySymbol} {selectedFactura.igv.toFixed(2)}</strong></div>
                <div>Total: <strong>{selectedFactura.currencySymbol} {selectedFactura.total.toFixed(2)}</strong></div>
              </div>
              <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
                <button className="remove-btn" onClick={()=>handleDeleteFactura(selectedFactura.id)}>Eliminar</button>
                <button className="save-btn" onClick={handleLoadFacturaToForm}>Editar en formulario</button>
                <button className="add-btn" onClick={()=>setSelectedFactura(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
