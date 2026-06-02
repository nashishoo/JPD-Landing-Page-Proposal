# JPD Landing Page Proposal

Este repositorio contiene la propuesta de **Landing Page de Alta Fidelidad** para **JPD Servicios Agrícolas**, diseñada para profesionalizar su presencia digital, proyectar confianza corporativa y facilitar tanto la contratación de cuadrillas operativas como la inscripción de trabajadores agrícolas locales en la Región de O'Higgins, Chile.

> [!IMPORTANT]
> **ESTA VERSIÓN ES UN MOCKUP / PROPUESTA DE DISEÑO INTERACTIVO**  
> Todos los flujos, el panel de acceso (login) y los formularios de registro operan bajo simulación interactiva con respuestas de retroalimentación inmediata (*mock validations*). En una etapa posterior del proyecto, se acoplará la lógica de servidores (*backend*), bases de datos y la documentación técnica de producción.

---

## 🌟 Visión & Misión de la Propuesta

El objetivo de esta propuesta es capturar el gran valor orgánico y social que **JPD Servicios Agrícolas** posee en la comunidad y transformarlo en un activo digital de alta conversión y excelencia visual.

### 🎯 Misión
**Dignificar y profesionalizar la externalización de mano de obra en el campo chileno.**
A través de la plataforma, se busca dar visibilidad a la cultura de respeto que lidera Jorge "Kitto" Pailamilla: pagos justos y oportunos, transporte diario seguro, trato familiar y una estrecha relación de apoyo social con escuelas y el deporte local. La página web actúa como el puente principal para garantizar cuadrillas confiables de cosecha y empaque a productores agrícolas premium, cuidando cada detalle del fruto desde el huerto hasta el packing.

### 👁️ Visión
**Consolidarse como el referente digital absoluto de confianza y transparencia operativa agrícola en Chile.**
Se proyecta a JPD no solo como un contratista, sino como un socio estratégico indispensable para las grandes exportadoras de frutas (Verfrut, Copefrut, Olisur, etc.), integrando tecnología fluida y accesibilidad para agilizar la captación de talento rural y responder con máxima rapidez a las necesidades operativas de la temporada.

---

## ⚡ Características Destacadas de la Interfaz (UI/UX)

La plataforma fue desarrollada siguiendo estándares modernos de diseño web dinámico de nivel premium:
* **Menú Lateral Móvil en Domo Oscuro (iOS Glassmorphism)**: Un cajón de navegación lateral interactivo deslizante con fondo translúcido marino, iconos personalizados de *Material Symbols*, animaciones de desplazamiento al tacto (*hover slides*) y bloqueo del scroll de fondo para una experiencia nativa de aplicación móvil.
* **Sección de Servicios Acordeón con Showcase Dinámico**: Reconfigurada de forma inteligente en dispositivos móviles. Muestra el bloque visual en la parte superior y permite al usuario expandir las tarjetas de servicios (Cosecha, Empaque, Ventajas) de forma fluida mediante toques, aplicando transiciones de altura y alternando las imágenes con fundidos cruzados y efectos Ken Burns.
* **Modal de Login Centrado (Mockup)**: Una interfaz moderna de inicio de sesión diseñada en el centro de la pantalla que se activa mediante el botón **"Ingresar"**, aplicando un desenfoque de fondo profundo de alta gama para administrar el panel de control simulado.
* **Animaciones al Desplazar (Scroll Reveal)**: Integración total del API nativo `IntersectionObserver` de Javascript y transiciones de CSS aceleradas por hardware para desvanecer y deslizar los elementos de forma secuencial y fluida mientras el usuario explora el sitio.
* **Firmas de Identidad Visual**: Acabado estético detallado que incluye marcas de agua flotantes dinámicas con el escudo de JPD y el pie de firma destacado de la diseñadora **Catapaz** en el copyright con degradados fucsias y micro-animaciones al pasar el cursor.

---

## 📁 Estructura del Proyecto (Limpia y Optimizada)

El directorio ha sido ordenado de forma óptima para facilitar su portabilidad y lectura rápida:

```bash
JPD-Landing-Page-Proposal/
│
├── data/                             # Data local extraída del scraper
│   ├── cleaned_jpd_data.json         # Dataset procesado principal
│   ├── facebook_data.json            # Respuestas en bruto de redes sociales
│   └── owner_data.json               # Datos biográficos estructurados del propietario
│
├── gallery/                          # Archivos de la galería interactiva
│   └── *.webp                        # 20 imágenes WebP súper livianas de alta compresión (no JPG)
│
├── index.html                        # Maquetación semántica e interactiva del sitio (con Modales)
├── index.css                         # Hoja de estilos con variables, media queries y animaciones
├── index.js                          # Lógica interactiva en Vanilla Javascript
├── jpd_real.webp                     # Fotografía destacada del fundador Jorge Pailamilla
├── logo jpd.jpg                      # Logotipo circular oficial de JPD
├── logo texto jpd.jpg                # Logotipo textual secundario de JPD
├── hero-harvest.webp                 # Fondos de pantalla del carrusel principal
├── hero-packing.webp
├── hero-team.webp
├── servicios-cosecha.webp            # Recursos de la sección de servicios
├── servicios-empaque.webp
├── servicios-ventajas.webp
└── README.md                         # Esta documentación general
```

---

## 💻 Ejecución Local

Para visualizar la propuesta interactiva, no necesitas configurar bases de datos ni instalar servidores pesados:

1. Descarga o clona este repositorio.
2. Abre el archivo principal `index.html` en cualquier navegador web moderno (Google Chrome, Safari, Mozilla Firefox, Microsoft Edge).
3. *(Opcional)* Ejecuta la extensión **Live Server** de Visual Studio Code o corre un servidor estático local rápido de Node.js:
   ```bash
   npx serve .
   ```
