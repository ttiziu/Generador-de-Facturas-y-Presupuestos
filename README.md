# Generador de Facturas y Presupuestos

[¡Probar la aplicación online!](https://generador-de-facturas-y-presupuesto.vercel.app)

Generador de Facturas y Presupuestos es una aplicación web moderna desarrollada en React que permite crear, visualizar, descargar y gestionar facturas o presupuestos de manera sencilla y profesional. Está pensada para pequeñas empresas, emprendedores y profesionales que necesitan una solución ágil y visualmente atractiva para la gestión de sus documentos comerciales.

## Características principales

- **Autenticación de usuarios** (Firebase Auth)
- **Gestión de clientes y productos/servicios**
- **Historial de facturas** con búsqueda y edición
- **Generación y descarga de facturas en PDF**
- **Cálculo automático de IGV (18%) y totales**
- **Soporte para múltiples monedas** (Soles, Dólares, Euros)
- **Animaciones modernas** (GSAP, fondo animado tipo "waves")
- **Modo claro/oscuro**
- **Persistencia en la nube** (Firebase Firestore)
- **Validaciones inteligentes** y autocompletado de datos por RUC/DNI (APIs públicas)

## Capturas de pantalla

### Login

![Login](src/assets/Captura%20de%20pantalla%202025-06-02%20182957.png)

### Página principal

![Página principal](src/assets/Captura%20de%20pantalla%202025-06-02%20183434.png)

### Ejemplo de factura

![Ejemplo de factura](src/assets/Captura%20de%20pantalla%202025-06-02%20183515.png)

## Tecnologías y herramientas utilizadas

- **React**: Librería principal para la construcción de la interfaz de usuario.
- **Firebase**: Autenticación y base de datos en la nube (Firestore).
- **GSAP**: Animaciones de entrada y transiciones.
- **reactbits.dev/Waves**: Fondo animado interactivo tipo "waves" para una experiencia visual moderna.
- **jsPDF**: Generación de archivos PDF desde el navegador.
- **Vite**: Herramienta de desarrollo y build para proyectos React.
- **APIs públicas**: Consulta de datos de clientes por RUC/DNI.
- **CSS moderno**: Estilos globales, variables CSS, modo oscuro/claro y diseño responsive.

## Créditos y agradecimientos

- Fondo animado: [reactbits.dev/waves](https://reactbits.dev/components/waves)
- APIs públicas de RUC/DNI: [apis.net.pe](https://apis.net.pe/)
- Animaciones: [GSAP](https://greensock.com/gsap/)

## Instrucciones adicionales

- Si deseas personalizar los colores, logos o textos, puedes editar los archivos en la carpeta `src/`.
- Para cambiar el fondo animado, ajusta las props del componente `Waves` en `App.jsx`.
- Si tienes problemas con la autenticación o la base de datos, revisa la configuración de tu proyecto en Firebase y asegúrate de que las reglas de Firestore permitan lectura/escritura para usuarios autenticados.
- Puedes desplegar la aplicación fácilmente en servicios como Vercel, Netlify o Firebase Hosting.
- Para soporte o sugerencias, abre un issue en el repositorio.

---

**Desarrollado por:** Jherry Paolo Visalot Girón  
**Licencia:** MIT
