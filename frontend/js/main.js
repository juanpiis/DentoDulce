// API Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('token');
let userData = JSON.parse(localStorage.getItem('userData')) || null;

// Fetch servicios al cargar
document.addEventListener('DOMContentLoaded', () => {
    cargarServicios();
    configurarFormularioContacto();
});

// Cargar servicios desde API
async function cargarServicios() {
    try {
        const response = await fetch(`${API_URL}/servicios`);
        const data = await response.json();

        if (data.success) {
            mostrarServicios(data.servicios);
        }
    } catch (error) {
        console.error('Error al cargar servicios:', error);
    }
}

// Mostrar servicios en el DOM
function mostrarServicios(servicios) {
    const container = document.getElementById('serviciosContainer');
    
    container.innerHTML = servicios.map(servicio => `
        <div class="card servicios-grid">
            <div class="card-header">🦷 ${servicio.nombre}</div>
            <div class="card-body">
                <p>${servicio.descripcion || 'Servicio de calidad dental'}</p>
                <div class="servicio-precio">$${servicio.precio.toFixed(2)}</div>
                <div class="servicio-duracion">⏱️ ${servicio.duracion_minutos} minutos</div>
            </div>
            <div class="card-footer">
                ${authToken ? 
                    `<a href="paciente/reservar-cita.html" class="btn btn-primary">Reservar</a>` :
                    `<a href="login.html" class="btn btn-primary">Iniciar sesión</a>`
                }
            </div>
        </div>
    `).join('');
}

// Configurar formulario de contacto
function configurarFormularioContacto() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            alert('Gracias por tu mensaje. Nos pondremos en contacto pronto.');
            form.reset();
        });
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}
