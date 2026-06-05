
// Mock de google.script.run para pruebas locales con comentarios y nuevos estados
(function() {
  const scope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);

  scope.google = {
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
          const mockPartidos = [
            { idPartido: "M1", fase: "Fase de Grupos", grupo: "A", nombreLocal: "México", nombreVisita: "Sudáfrica", emojiLocal: "🇲🇽", emojiVisita: "🇿🇦", inputsHabilitados: true, estadoPronostico: "ABIERTO", golLocalReal: null, golVisitaReal: null, miPronostico: null, matchNum: "1" },
            { idPartido: "M2", fase: "Fase de Grupos", grupo: "A", nombreLocal: "Corea del Sur", nombreVisita: "República Checa", emojiLocal: "🇰🇷", emojiVisita: "🇨🇿", inputsHabilitados: true, estadoPronostico: "ABIERTO", golLocalReal: null, golVisitaReal: null, miPronostico: null, matchNum: "2" },
            { idPartido: "M3", fase: "Fase de Grupos", grupo: "A", nombreLocal: "República Checa", nombreVisita: "Corea del Sur", emojiLocal: "🇨🇿", emojiVisita: "🇰🇷", inputsHabilitados: true, estadoPronostico: "ABIERTO", golLocalReal: null, golVisitaReal: null, miPronostico: null, matchNum: "3" },
            { idPartido: "M7", fase: "Fase de Grupos", grupo: "B", nombreLocal: "Canadá", nombreVisita: "Bosnia y Herzegovina", emojiLocal: "🇨🇦", emojiVisita: "🇧🇦", inputsHabilitados: true, estadoPronostico: "ABIERTO", golLocalReal: null, golVisitaReal: null, miPronostico: null, matchNum: "7" },
            { idPartido: "M8", fase: "Fase de Grupos", grupo: "B", nombreLocal: "Qatar", nombreVisita: "Suiza", emojiLocal: "🇶🇦", emojiVisita: "🇨🇭", inputsHabilitados: true, estadoPronostico: "ABIERTO", golLocalReal: null, golVisitaReal: null, miPronostico: null, matchNum: "8" },
            { idPartido: "M13", fase: "Fase de Grupos", grupo: "C", nombreLocal: "Brasil", nombreVisita: "Marruecos", emojiLocal: "🇧🇷", emojiVisita: "🇲🇦", inputsHabilitados: true, estadoPronostico: "ABIERTO", golLocalReal: null, golVisitaReal: null, miPronostico: null, matchNum: "13" },
            { idPartido: "M19", fase: "Fase de Grupos", grupo: "D", nombreLocal: "Estados Unidos", nombreVisita: "Paraguay", emojiLocal: "🇺🇸", emojiVisita: "🇵🇾", inputsHabilitados: true, estadoPronostico: "ABIERTO", golLocalReal: null, golVisitaReal: null, miPronostico: null, matchNum: "19" },
            { idPartido: "M73", fase: "Ronda de 32", grupo: "", nombreLocal: "2do Grupo A", nombreVisita: "2do Grupo B", emojiLocal: "", emojiVisita: "", inputsHabilitados: false, estadoPronostico: "ESPERANDO", golLocalReal: null, golVisitaReal: null, miPronostico: null, matchNum: "73" },
            { idPartido: "M104", fase: "Final", grupo: "", nombreLocal: "Ganador M101", nombreVisita: "Ganador M102", emojiLocal: "", emojiVisita: "", inputsHabilitados: false, estadoPronostico: "ESPERANDO", golLocalReal: null, golVisitaReal: null, miPronostico: null, matchNum: "104" }
          ];
          setTimeout(() => { if (this.successHandler) this.successHandler({ success: true, partidos: mockPartidos }); }, 500);
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
      }
    }
  };
})();
