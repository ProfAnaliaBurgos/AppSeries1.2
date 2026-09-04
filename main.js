// Referencias a elementos del DOM
const secAuth = document.getElementById('sec-auth');
const secFormulario = document.getElementById('sec-formulario');
const userInfo = document.getElementById('user-info');
const btnLogout = document.getElementById('btn-logout');

const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

const formSerie = document.getElementById('form-serie');
const contenedorCards = document.getElementById('contenedor-cards');

// Variable global para almacenar el usuario activo
let usuarioActual = null;

// ==========================================
// 1. GESTIÓN DE SESIÓN Y AUTENTICACIÓN
// ==========================================

// Verificar el estado de la sesión al cargar la página
async function verificarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    usuarioActual = session.user;
    mostrarInterfazLogueado();
  } else {
    usuarioActual = null;
    mostrarInterfazDeslogueado();
  }
}

// Registrar un nuevo usuario
btnRegister.addEventListener('click', async () => {
  const email = authEmail.value;
  const password = authPassword.value;

  if (!email || !password) {
    alert('Por favor, completá el email y la contraseña.');
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    alert('Error al registrarse: ' + error.message);
  } else {
    alert('¡Registro exitoso! Ya podés ingresar con tu cuenta.');
  }
});

// Iniciar sesión
btnLogin.addEventListener('click', async () => {
  const email = authEmail.value;
  const password = authPassword.value;

  if (!email || !password) {
    alert('Por favor, ingresá email y contraseña.');
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert('Error al iniciar sesión: ' + error.message);
  } else {
    usuarioActual = data.user;
    mostrarInterfazLogueado();
  }
});

// Cerrar sesión
btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut();
  usuarioActual = null;
  mostrarInterfazDeslogueado();
});

// Cambiar la vista de la UI para usuarios autenticados
function mostrarInterfazLogueado() {
  secAuth.style.display = 'none';
  secFormulario.style.display = 'block';
  btnLogout.style.display = 'inline-block';
  userInfo.textContent = `Hola, ${usuarioActual.email}`;
}

// Cambiar la vista de la UI para visitantes
function mostrarInterfazDeslogueado() {
  secAuth.style.display = 'block';
  secFormulario.style.display = 'none';
  btnLogout.style.display = 'none';
  userInfo.textContent = '';
  document.getElementById('form-auth').reset();
}

// ==========================================
// 2. GUARDAR NUEVA RECOMENDACIÓN EN SUPABASE
// ==========================================

formSerie.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!usuarioActual) {
    alert('Debés iniciar sesión para publicar.');
    return;
  }

  // Capturar datos del formulario
  const titulo = document.getElementById('titulo').value;
  const genero = document.getElementById('genero').value;
  const puntuacion = parseFloat(document.getElementById('puntuacion').value);
  const imagenUrl = document.getElementById('imagen').value || 'https://via.placeholder.com/300x400?text=Sin+Portada';
  const resena = document.getElementById('resena').value;

  // Insertar en la tabla 'series' de Supabase
  const { data, error } = await supabase
    .from('series')
    .insert([
      {
        titulo: titulo,
        genero: genero,
        puntuacion: puntuacion,
        imagen_url: imagenUrl,
        resena: resena,
        user_email: usuarioActual.email
      }
    ]);

  if (error) {
    alert('Error al guardar la serie: ' + error.message);
  } else {
    alert('¡Serie recomendada con éxito!');
    formSerie.reset();
    cargarCatalogo(); // Recargar las tarjetas
  }
});

// ==========================================
// 3. OBTENER Y MOSTRAR CATÁLOGO DE SERIES
// ==========================================

// ==========================================
// 3. OBTENER Y MOSTRAR CATÁLOGO DE SERIES (CON EDITAR Y ELIMINAR)
// ==========================================

// ==========================================
// MOSTRAR CATÁLOGO CON SECCIÓN DE COMENTARIOS
// ==========================================

async function cargarCatalogo() {
  contenedorCards.innerHTML = '<p>Cargando recomendaciones...</p>';

  // 1. Obtener todas las series
  const { data: series, error: errSeries } = await supabase
    .from('series')
    .select('*')
    .order('id', { ascending: false });

  if (errSeries) {
    contenedorCards.innerHTML = '<p>Error al cargar el catálogo.</p>';
    console.error(errSeries);
    return;
  }

  if (series.length === 0) {
    contenedorCards.innerHTML = '<p>Aún no hay recomendaciones. ¡Sé el primero en agregar una!</p>';
    return;
  }

  // 2. Obtener todos los comentarios de una sola consulta
  const { data: comentarios, error: errComentarios } = await supabase
    .from('comentarios')
    .select('*')
    .order('created_at', { ascending: true });

  if (errComentarios) console.error(errComentarios);

  contenedorCards.innerHTML = '';

  // 3. Renderizar cada card con sus comentarios
  series.forEach(serie => {
    const esPropietario = usuarioActual && usuarioActual.email === serie.user_email;

    // Filtrar los comentarios que pertenecen a ESTA serie
    const comentariosSerie = comentarios ? comentarios.filter(c => c.serie_id === serie.id) : [];

    // Generar el HTML de la lista de comentarios
    let listaComentariosHTML = '';
    comentariosSerie.forEach(c => {
      listaComentariosHTML += `
        <div class="comentario-item">
          <strong>${c.user_email.split('@')[0]}:</strong> ${c.texto}
        </div>
      `;
    });

    const cardHTML = `
      <article class="card-serie">
        <img src="${serie.imagen_url}" alt="Portada de ${serie.titulo}" onerror="this.src='https://via.placeholder.com/300x400?text=Sin+Imagen'">
        <div class="card-body">
          <div class="card-header-info">
            <span class="badge-genero">${serie.genero}</span>
            <span class="score">★ ${serie.puntuacion}</span>
          </div>
          <h3 class="card-title">${serie.titulo}</h3>
          <p class="card-resena">${serie.resena}</p>
          <div class="card-footer-author">
            Recomendado por: <strong>${serie.user_email}</strong>
          </div>

          ${esPropietario ? `
            <div class="card-actions">
              <button onclick="editarSerie(${serie.id}, '${serie.resena.replace(/'/g, "\\'")}', ${serie.puntuacion})" class="btn-action btn-edit">Editar</button>
              <button onclick="eliminarSerie(${serie.id})" class="btn-action btn-delete">Eliminar</button>
            </div>
          ` : ''}

          <!-- SECCIÓN DE COMENTARIOS -->
          <div class="seccion-comentarios">
            <h4>Comentarios (${comentariosSerie.length})</h4>
            <div class="lista-comentarios">
              ${listaComentariosHTML || '<p class="sin-comentarios">Sin comentarios aún.</p>'}
            </div>

            ${usuarioActual ? `
              <div class="form-comentario">
                <input type="text" id="input-comentario-${serie.id}" placeholder="Escribí un comentario..." />
                <button onclick="agregarComentario(${serie.id})" class="btn-comentar">Enviar</button>
              </div>
            ` : '<p class="aviso-login-comentario">Iniciá sesión para comentar.</p>'}
          </div>

        </div>
      </article>
    `;
    contenedorCards.innerHTML += cardHTML;
  });
}

// ==========================================
// FUNCIÓN PARA GUARDAR UN COMENTARIO
// ==========================================

window.agregarComentario = async function(serieId) {
  const input = document.getElementById(`input-comentario-${serieId}`);
  const texto = input.value.trim();

  if (!texto) {
    alert("Escribí algo antes de enviar.");
    return;
  }

  const { error } = await supabase
    .from('comentarios')
    .insert([
      {
        texto: texto,
        user_email: usuarioActual.email,
        serie_id: serieId
      }
    ]);

  if (error) {
    alert("Error al comentar: " + error.message);
  } else {
    input.value = '';
    cargarCatalogo(); // Recargar para ver el nuevo comentario
  }
};
// ==========================================
// 4. FUNCIONES DE BORRADO Y EDICIÓN
// ==========================================

// ELIMINAR REGISTRO DE SUPABASE
window.eliminarSerie = async function(id) {
  const confirmacion = confirm("¿Estás seguro/a de que querés borrar esta recomendación?");
  
  if (!confirmacion) return;

  const { error } = await supabase
    .from('series')
    .delete()
    .eq('id', id);

  if (error) {
    alert("Error al eliminar: " + error.message);
  } else {
    alert("¡Recomendación eliminada con éxito!");
    cargarCatalogo(); // Recargamos la lista
  }
};

// EDITAR REGISTRO EN SUPABASE
window.editarSerie = async function(id, resenaActual, puntuacionActual) {
  // Pedimos los nuevos valores mediante ventanas prompt sencillas para la clase
  const nuevaResena = prompt("Modificá tu reseña:", resenaActual);
  if (nuevaResena === null) return; // Si cancela, salimos

  const nuevaPuntuacion = prompt("Modificá la puntuación (1 al 10):", puntuacionActual);
  if (nuevaPuntuacion === null) return;

  const puntuacionNum = parseFloat(nuevaPuntuacion);

  if (isNaN(puntuacionNum) || puntuacionNum < 1 || puntuacionNum > 10) {
    alert("Por favor ingresá un número válido entre 1 y 10.");
    return;
  }

  // Actualizamos el registro en la base de datos
  const { error } = await supabase
    .from('series')
    .update({ 
      resena: nuevaResena, 
      puntuacion: puntuacionNum 
    })
    .eq('id', id);

  if (error) {
    alert("Error al actualizar: " + error.message);
  } else {
    alert("¡Recomendación actualizada!");
    cargarCatalogo(); // Recargamos el catálogo
  }
};
// INICIALIZACIÓN
verificarSesion();
cargarCatalogo();