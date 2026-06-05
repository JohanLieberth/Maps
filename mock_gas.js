
// Mock de google.script.run para pruebas locales.
// Este script solo se ejecuta en el cliente (navegador) si google.script.run no existe.
(function() {
  // Verificar si estamos en un entorno con 'window' (navegador)
  if (typeof window !== 'undefined') {
    // Solo inicializar si no estamos dentro del entorno real de Google Apps Script
    if (!window.google || !window.google.script || !window.google.script.run) {
      window.google = window.google || {};
      window.google.script = window.google.script || {};

      window.google.script.run = {
        withSuccessHandler: function(callback) {
          this.successHandler = callback;
          return this;
        },
        withFailureHandler: function(callback) {
          this.failureHandler = callback;
          return this;
        },
        loginParticipante: function(email) {
          console.log("Mock: loginParticipante", email);
          setTimeout(() => {
            if (this.successHandler) {
              this.successHandler({
                success: true,
                participante: {
                  email: email, nombre: "Usuario Prueba", alias: "Tester", puntosTotales: 10, aciertosExactos: 2,
                  estatusPago: "Observado", comentarioPago: "Tu comprobante es ilegible, favor de subirlo nuevamente."
                }
              });
            }
          }, 500);
        },
        obtenerPartidosParaUsuario: function(email) {
          console.log("Mock: obtenerPartidosParaUsuario", email);
          setTimeout(() => { if (this.successHandler) this.successHandler({ success: true, partidos: [] }); }, 500);
        },
        obtenerRanking: function() {
          console.log("Mock: obtenerRanking");
          setTimeout(() => { if (this.successHandler) this.successHandler([]); }, 500);
        },
        registrarParticipante: function() {
          console.log("Mock: registrarParticipante");
          setTimeout(() => { if (this.successHandler) this.successHandler({ success: true }); }, 500);
        },
        guardarPronosticos: function() {
          console.log("Mock: guardarPronosticos");
          setTimeout(() => { if (this.successHandler) this.successHandler({ success: true, guardados: 0 }); }, 500);
        },
        subirComprobante: function() {
          console.log("Mock: subirComprobante");
          setTimeout(() => { if (this.successHandler) this.successHandler({ success: true }); }, 500);
        },
        seedPartidos: function() {
          console.log("Mock: seedPartidos");
          setTimeout(() => { if (this.successHandler) this.successHandler({ success: true }); }, 500);
        },
        actualizarResultadoManual: function() {
          console.log("Mock: actualizarResultadoManual");
          setTimeout(() => { if (this.successHandler) this.successHandler({ success: true, message: "Resultado guardado (Mock)" }); }, 500);
        },
        insertarDatosPrueba: function() {
          console.log("Mock: insertarDatosPrueba");
          setTimeout(() => { if (this.successHandler) this.successHandler({ success: true, message: "Datos de prueba insertados (Mock)" }); }, 500);
        }
      };
    }
  } else {
    // Si estamos en el servidor (entorno .gs), este archivo no hace nada para evitar ReferenceError
    console.log("Aviso: mock_gas se cargó en el servidor, pero está diseñado para el cliente.");
  }
})();
