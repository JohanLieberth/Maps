
// Mock de google.script.run para pruebas locales con comentarios y nuevos estados
window.google = {
  script: {
    run: {
      withSuccessHandler: function(callback) {
        this.successHandler = callback;
        return this;
      },
      withFailureHandler: function(callback) {
        this.failureHandler = callback;
        return this;
      },
      loginParticipante: function(email) {
        setTimeout(() => {
          this.successHandler({
            success: true,
            participante: {
              email: email, nombre: "Usuario Prueba", alias: "Tester", puntosTotales: 10, aciertosExactos: 2,
              estatusPago: "Observado", comentarioPago: "Tu comprobante es ilegible, favor de subirlo nuevamente."
            }
          });
        }, 500);
      },
      obtenerPartidosParaUsuario: function(email) {
        setTimeout(() => { this.successHandler({ success: true, partidos: [] }); }, 500);
      },
      obtenerRanking: function() {
        setTimeout(() => { this.successHandler([]); }, 500);
      },
      registrarParticipante: function() { setTimeout(() => { this.successHandler({ success: true }); }, 500); },
      guardarPronosticos: function() { setTimeout(() => { this.successHandler({ success: true, guardados: 0 }); }, 500); },
      subirComprobante: function() { setTimeout(() => { this.successHandler({ success: true }); }, 500); }
    }
  }
};
