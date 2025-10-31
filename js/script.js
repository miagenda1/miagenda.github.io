const $ = q => document.querySelector(q);
const $$ = q => document.querySelectorAll(q);
const fechaSel = new Date();
let tareas = JSON.parse(localStorage.getItem('tareas')) || [];
let notas = localStorage.getItem('notas') || '';
let nombre = localStorage.getItem('nombre') || '';
$('#notas').value = notas;
$('#nombreUsuario').value = nombre;
$('#saludo').textContent = '¡Hola, ' + (nombre || 'Estudiante') + '!';

// modo oscuro
if (localStorage.getItem('dark') === 'dark') document.documentElement.setAttribute('data-theme','dark');
$('#toggleModo').onclick = () => {
  const esDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', esDark ? 'light' : 'dark');
  localStorage.setItem('dark', esDark ? 'light' : 'dark');
};

// perfil
$('#nombreUsuario').oninput = e => {
  localStorage.setItem('nombre', e.target.value);
  $('#saludo').textContent = ¡Hola, ${e.target.value || 'Estudiante'}!;
};
$('#avatar').onclick = () => {
  const url = prompt('URL de tu imagen:');
  if (url) {
    $('#avatar').src = url;
    localStorage.setItem('avatar', url);
  }
};
if (localStorage.getItem('avatar')) $('#avatar').src = localStorage.getItem('avatar');

// notas
$('#notas').oninput = e => localStorage.setItem('notas', e.target.value);

// calendario
const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function pintarCal() {
  const year = fechaSel.getFullYear();
  const mes = fechaSel.getMonth();
  $('#mesTitulo').textContent = ${meses[mes]} ${year};
  const primerDia = new Date(year, mes, 1).getDay();
  const diasMes = new Date(year, mes + 1, 0).getDate();
  const hoy = new Date();
  let html = '';
  for (let i = 0; i < primerDia; i++) html += '<div></div>';
  for (let d = 1; d <= diasMes; d++) {
    const esHoy = hoy.getDate() === d && hoy.getMonth() === mes && hoy.getFullYear() === year;
    html += <div class="${esHoy ? 'hoy' : ''}" data-dia="${d}">${d}</div>;
  }
  $('#diasCal').innerHTML = html;
  $$('#diasCal div[data-dia]').forEach(el => el.onclick = () => {
    fechaSel.setDate(el.dataset.dia);
    renderTareas();
  });
}
$('#prevMes').onclick = () => { fechaSel.setMonth(fechaSel.getMonth() - 1); pintarCal(); };
$('#nextMes').onclick = () => { fechaSel.setMonth(fechaSel.getMonth() + 1); pintarCal(); };
pintarCal();

// tareas
$('#formTarea').onsubmit = e => {
  e.preventDefault();
  const t = {
    id: Date.now(),
    titulo: $('#titulo').value.trim(),
    inicio: $('#horaInicio').value,
    fin: $('#horaFin').value,
    categoria: $('#categoria').value,
    prioridad: $('#prioridad').value,
    fecha: fechaSel.toISOString().slice(0,10),
    completada: false
  };
  tareas.push(t);
  guardarTareas();
  renderTareas();
  e.target.reset();
};
function guardarTareas() { localStorage.setItem('tareas', JSON.stringify(tareas)); }
function renderTareas() {
  const fecha = fechaSel.toISOString().slice(0,10);
  let lista = tareas.filter(t => t.fecha === fecha);
  const busq = $('#buscador').value.trim().toLowerCase();
  const cat = $('#filtroCateg').value;
  if (busq) lista = lista.filter(t => t.titulo.toLowerCase().includes(busq));
  if (cat) lista = lista.filter(t => t.categoria === cat);
  lista.sort((a,b) => a.inicio.localeCompare(b.inicio));

  $('#listaTareas').innerHTML = lista.map(t => `
    <li class="tarea ${t.completada?'completada':''}" data-id="${t.id}">
      <div>
        <strong>${t.titulo}</strong> (${t.inicio} - ${t.fin})<br>
        <small>${t.categoria} · ${t.prioridad} prioridad</small>
      </div>
      <div>
        <button onclick="toggleTarea(${t.id})">✓</button>
        <button onclick="editarTarea(${t.id})">✎</button>
        <button onclick="borrarTarea(${t.id})">🗑</button>
      </div>
    </li>`).join('');
  actualizarProgreso(lista);
}
window.toggleTarea = id => {
  const t = tareas.find(x => x.id === id);
  t.completada = !t.completada;
  guardarTareas();
  renderTareas();
};
window.borrarTarea = id => {
  if (confirm('¿Borrar tarea?')) {
    tareas = tareas.filter(x => x.id !== id);
    guardarTareas();
    renderTareas();
  }
};
window.editarTarea = id => {
  const t = tareas.find(x => x.id === id);
  $('#titulo').value = t.titulo;
  $('#horaInicio').value = t.inicio;
  $('#horaFin').value = t.fin;
  $('#categoria').value = t.categoria;
  $('#prioridad').value = t.prioridad;
  borrarTarea(id);
};
$('#buscador').oninput = renderTareas;
$('#filtroCateg').onchange = renderTareas;
function actualizarProgreso(lista) {
  const total = lista.length;
  const hechas = lista.filter(t => t.completada).length;
  const porc = total ? Math.round((hechas / total) * 100) : 0;
  $('#barraProgreso').style.width = porc + '%';
  $('#textoProgreso').textContent = Has completado ${hechas} de ${total} tareas;
}
renderTareas();

// Pomodoro
let pomodoroInterval = null;
let tiempoRestante = 25 * 60;
let esEstudio = true;
function fmtT(s) {
  const m = Math.floor(s / 60);
  const seg = s % 60;
  return ${m.toString().padStart(2,'0')}:${seg.toString().padStart(2,'0')};
}
function ticPomodoro() {
  if (tiempoRestante <= 0) {
    clearInterval(pomodoroInterval);
    $('#audioFin').play();
    esEstudio = !esEstudio;
    tiempoRestante = (esEstudio ? $('#minEstudio').value : $('#minDescanso').value) * 60;
    $('#reloj').textContent = fmtT(tiempoRestante);
    return;
  }
  tiempoRestante--;
  $('#reloj').textContent = fmtT(tiempoRestante);
}
$('#btnIniciar').onclick = () => {
  if (pomodoroInterval) return;
  pomodoroInterval = setInterval(ticPomodoro, 1000);
};
$('#btnPausar').onclick = () => { clearInterval(pomodoroInterval); pomodoroInterval = null; };
$('#btnReiniciar').onclick = () => {
  clearInterval(pomodoroInterval);
  pomodoroInterval = null;
  esEstudio = true;
  tiempoRestante = $('#minEstudio').value * 60;
  $('#reloj').textContent = fmtT(tiempoRestante);
};