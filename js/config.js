/* =====================================================================
   BULK PRINT FARM — config.js
   Todo lo que cambia seguido vive acá: tarifas, impresoras, contacto y
   el destino del formulario. El resto del sitio lee de este archivo.
   ===================================================================== */
window.BPF_CONFIG = {
  /* Las tarifas por hora y los precios del filamento de abajo son DE EJEMPLO.
     Cuando cargues los reales, pasá esto a false y desaparece el aviso
     "precios de ejemplo". */
  PRICES_ARE_PLACEHOLDER: true,

  CURRENCY: "ARS",
  LOCALE: "es-AR",

  /* URL que recibe el pedido (POST multipart/form-data con los archivos).
     Vacío = el formulario valida pero deriva a WhatsApp en vez de enviar. */
  FORM_ENDPOINT: "",

  MAX_UNITS: 20,          // máximo de impresoras por pedido
  MAX_FILES: 5,           // archivos por pedido
  MAX_FILE_MB: 100,       // peso máximo por archivo
  ACCEPT: [".stl", ".3mf"],
  MAX_GRAMS: 20000,       // tope de gramos de filamento por máquina que acepta el formulario

  CONTACT: {
    whatsapp: "5491155512480",            // sin + ni espacios (formato wa.me)
    whatsappLabel: "+54 9 11 5551-2480",
    email: "hola@bulk3dstudio.com",
    instagram: "bulk3dstudio"
  },

  /* Filamento: lo ponemos nosotros y se cobra aparte, por gramo.
     El cliente elige la marca cuando selecciona un material y carga los gramos.
     pricePerKg = precio por kilo. Si cambia según el material, en vez de un
     número se puede poner un objeto: { PLA: 18000, PETG: 21000, default: 24000 } */
  FILAMENT_BRANDS: [
    { id: "marca-1", name: "Marca 1", pricePerKg: 18000 },
    { id: "marca-2", name: "Marca 2", pricePerKg: 22000 },
    { id: "marca-3", name: "Marca 3", pricePerKg: 26000 },
    { id: "marca-4", name: "Marca 4", pricePerKg: 30000 },
    { id: "marca-5", name: "Marca 5", pricePerKg: 34000 }
  ],

  /* Orden = orden en que se muestran. pricePerHour = tarifa por hora y por
     máquina (el filamento va aparte). materials = lo que se puede pedir en ese
     modelo (el resto aparece deshabilitado en el formulario). */
  PRINTERS: [
    {
      id: "a1-mini",
      model: "A1 Mini",
      tag: "compacta",
      desc: "Para piezas chicas y prototipos rápidos, con multicolor AMS Lite.",
      volume: "180×180×180 mm",
      specs: [["Volumen", "180×180×180 mm"], ["Velocidad", "500 mm/s"], ["Color", "AMS Lite"]],
      materials: ["PLA", "PETG", "TPU"],
      img: "assets/img/impresoras/a1-mini-combo-lvl.webp",
      scale: 1.25,
      pricePerHour: 1800
    },
    {
      id: "a1",
      model: "A1",
      tag: "multicolor ágil",
      desc: "Mesa grande y multicolor ágil para PLA y PETG.",
      volume: "256×256×256 mm",
      specs: [["Volumen", "256×256×256 mm"], ["Velocidad", "500 mm/s"], ["Color", "AMS Lite"]],
      materials: ["PLA", "PETG", "TPU"],
      img: "assets/img/impresoras/a1-combo-lvl.webp",
      scale: 1.25,
      pricePerHour: 2400
    },
    {
      id: "p1s",
      model: "P1S",
      tag: "cerrada y veloz",
      desc: "El mejor balance de velocidad, calidad y materiales como ABS o ASA.",
      volume: "256×256×256 mm",
      specs: [["Volumen", "256×256×256 mm"], ["Velocidad", "500 mm/s"], ["Chasis", "Cerrado + filtro"]],
      materials: ["PLA", "PETG", "ABS", "ASA", "TPU"],
      img: "assets/img/impresoras/p1s-lvl.webp",
      scale: 1.45,
      pricePerHour: 3200
    },
    {
      id: "x1-carbon",
      model: "X1 Carbon",
      tag: "tope de gama",
      desc: "LiDAR y nozzle de acero endurecido para materiales técnicos.",
      volume: "256×256×256 mm",
      specs: [["Volumen", "256×256×256 mm"], ["Velocidad", "500 mm/s"], ["Nozzle", "Acero endurecido"]],
      materials: ["PLA", "PETG", "ABS", "ASA", "TPU"],
      img: "assets/img/impresoras/x1-carbon-lvl.webp",
      scale: 1.45,
      pricePerHour: 4200
    },
    {
      id: "h2s",
      model: "H2S",
      tag: "alto volumen",
      desc: "Piezas grandes y series de un material, con cámara calefaccionada.",
      volume: "340×320×340 mm",
      specs: [["Volumen", "340×320×340 mm"], ["Velocidad", "1000 mm/s"], ["Cámara", "Calefaccionada"]],
      materials: ["PLA", "PETG", "ABS", "ASA", "TPU"],
      img: "assets/img/impresoras/h2s-lvl.webp",
      scale: 1.45,
      pricePerHour: 5500
    },
    {
      id: "h2d",
      model: "H2D",
      tag: "gran formato",
      desc: "Doble nozzle: dos materiales o colores en la misma pieza, sin purga.",
      volume: "350×320×325 mm",
      specs: [["Volumen", "350×320×325 mm"], ["Velocidad", "1000 mm/s"], ["Extrusión", "Doble nozzle"]],
      materials: ["PLA", "PETG", "ABS", "ASA", "TPU"],
      img: "assets/img/impresoras/H2D-AMS-lvl.webp",
      scale: 1.45,
      pricePerHour: 6800
    }
  ],

  /* Chips de material del formulario. El primero es el valor por defecto. */
  MATERIALS: ["A definir", "PLA", "PETG", "ABS", "ASA", "TPU"]
};
