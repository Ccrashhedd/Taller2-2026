const API_URL = '../../Backend/PHP/productos.php';

const estado = {
    productoSeleccionado: null,
    copiaOriginal: null,
    modo: 'consulta',
};

const elementos = {};

window.addEventListener('DOMContentLoaded', iniciarAplicacion);

function iniciarAplicacion() {
    elementos.busquedaInput = document.getElementById('busquedaInput');
    elementos.productForm = document.getElementById('productForm');
    elementos.idProducto = document.getElementById('idProducto');
    elementos.codigoBarra = document.getElementById('codigoBarra');
    elementos.nombre = document.getElementById('nombre');
    elementos.precio = document.getElementById('precio');
    elementos.stock = document.getElementById('stock');
    elementos.categoria = document.getElementById('categoria');
    elementos.btnGuardar = document.getElementById('btnGuardar');
    elementos.btnEditar = document.getElementById('btnEditar');
    elementos.btnEliminar = document.getElementById('btnEliminar');
    elementos.btnCancelarEdit = document.getElementById('btnCancelarEdit');
    elementos.tablebody = document.getElementById('tablebody');
    elementos.mensajeEstado = document.getElementById('mensajeEstado');
    elementos.estadoFormulario = document.getElementById('estadoFormulario');

    registrarEventos();
    reiniciarFormulario();
    cargarProductos();
}

function registrarEventos() {
    elementos.busquedaInput.addEventListener('keydown', async (evento) => {
        if (evento.key !== 'Enter') {
            return;
        }

        evento.preventDefault();
        await procesarBusqueda();
    });

    elementos.btnGuardar.addEventListener('click', async () => {
        if (estado.modo !== 'nuevo' && estado.modo !== 'edicion') {
            mostrarMensaje('Primero escanea un código o selecciona un producto para editar.', 'advertencia');
            return;
        }

        await guardarProducto();
    });

    elementos.btnEditar.addEventListener('click', () => {
        if (!estado.productoSeleccionado) {
            mostrarMensaje('Selecciona un producto de la tabla o búscalo por código antes de editar.', 'advertencia');
            return;
        }

        estado.modo = 'edicion';
        estado.copiaOriginal = { ...estado.productoSeleccionado };
        habilitarCampos(true, false);
        actualizarEstadoFormulario('Modo edición activado. Ya puedes cambiar nombre, precio, stock y categoría.');
        mostrarMensaje('Ahora estás editando el producto seleccionado.', 'info');
        elementos.nombre.focus();
    });

    elementos.btnCancelarEdit.addEventListener('click', () => {
        if (estado.modo === 'nuevo') {
            reiniciarFormulario();
            mostrarMensaje('Registro cancelado.', 'info');
            return;
        }

        if (estado.modo === 'edicion' && estado.copiaOriginal) {
            cargarProductoEnFormulario(estado.copiaOriginal);
            estado.productoSeleccionado = { ...estado.copiaOriginal };
            estado.modo = 'consulta';
            habilitarCampos(false);
            actualizarEstadoFormulario('Edición cancelada.');
            mostrarMensaje('Se restauraron los datos originales del producto.', 'info');
        }
    });

    elementos.btnEliminar.addEventListener('click', async () => {
        if (!estado.productoSeleccionado || !estado.productoSeleccionado.idProducto) {
            mostrarMensaje('Selecciona un producto antes de eliminar.', 'advertencia');
            return;
        }

        const confirmado = window.confirm(`¿Deseas eliminar el producto "${estado.productoSeleccionado.nombre}"?`);
        if (!confirmado) {
            return;
        }

        await eliminarProducto(estado.productoSeleccionado.idProducto);
    });
}

async function procesarBusqueda() {
    const codigo = elementos.busquedaInput.value.trim();

    if (!/^\d{6,18}$/.test(codigo)) {
        mostrarMensaje('Ingresa o escanea un código de barras numérico entre 6 y 18 dígitos.', 'error');
        return;
    }

    actualizarEstadoFormulario('Buscando producto por código de barras...');

    try {
        const respuesta = await fetch(`${API_URL}?codigo_barras=${encodeURIComponent(codigo)}`);
        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            if (respuesta.status === 404) {
                prepararNuevoProducto(codigo);
                mostrarMensaje('No existe ese código. Puedes registrar el producto nuevo.', 'info');
                return;
            }

            throw new Error(resultado.mensaje || 'No se pudo completar la búsqueda.');
        }

        cargarProductoEnFormulario(resultado.datos);
        estado.productoSeleccionado = resultado.datos;
        estado.copiaOriginal = { ...resultado.datos };
        estado.modo = 'consulta';
        resaltarFilaSeleccionada(resultado.datos.idProducto);
        mostrarMensaje('Producto encontrado correctamente.', 'exito');
        actualizarEstadoFormulario('Producto encontrado.');
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

function prepararNuevoProducto(codigoBarras) {
    estado.productoSeleccionado = null;
    estado.copiaOriginal = null;
    estado.modo = 'nuevo';

    elementos.idProducto.value = '';
    elementos.codigoBarra.value = codigoBarras;
    elementos.nombre.value = '';
    elementos.precio.value = '';
    elementos.stock.value = '';
    elementos.categoria.value = '';

    habilitarCampos(true, true);
    actualizarEstadoFormulario('Modo registro activado. Completa los campos y presiona Guardar.');
    limpiarSeleccionTabla();
    elementos.nombre.focus();
}

function cargarProductoEnFormulario(producto) {
    elementos.idProducto.value = producto.idProducto ?? '';
    elementos.codigoBarra.value = producto.codigo_barras ?? '';
    elementos.nombre.value = producto.nombre ?? '';
    elementos.precio.value = producto.precio ?? '';
    elementos.stock.value = producto.cantidad ?? '';
    elementos.categoria.value = producto.categoria ?? '';

    habilitarCampos(false);
}

function obtenerDatosFormulario() {
    return {
        idProducto: elementos.idProducto.value.trim(),
        codigo_barras: elementos.codigoBarra.value.trim(),
        nombre: elementos.nombre.value.trim(),
        precio: elementos.precio.value.trim(),
        cantidad: elementos.stock.value.trim(),
        categoria: elementos.categoria.value.trim(),
    };
}

function validarFormulario(datos) {
    if (!/^\d{6,18}$/.test(datos.codigo_barras)) {
        return 'El código de barras debe ser numérico y tener entre 6 y 18 dígitos.';
    }

    if (datos.nombre.length < 2) {
        return 'El nombre debe tener al menos 2 caracteres.';
    }

    if (datos.precio === '' || Number(datos.precio) < 0) {
        return 'El precio debe ser un número válido mayor o igual a 0.';
    }

    if (!Number.isInteger(Number(datos.cantidad)) || Number(datos.cantidad) < 0) {
        return 'La cantidad debe ser un número entero mayor o igual a 0.';
    }

    if (datos.categoria.length < 2) {
        return 'La categoría debe tener al menos 2 caracteres.';
    }

    return null;
}

async function guardarProducto() {
    const datos = obtenerDatosFormulario();
    const errorValidacion = validarFormulario(datos);

    if (errorValidacion) {
        mostrarMensaje(errorValidacion, 'error');
        return;
    }

    const esNuevo = estado.modo === 'nuevo';
    const metodo = esNuevo ? 'POST' : 'PUT';

    if (!esNuevo) {
        datos.idProducto = Number(datos.idProducto);
    }

    try {
        actualizarEstadoFormulario(esNuevo ? 'Registrando producto...' : 'Actualizando producto...');

        const respuesta = await fetch(API_URL, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos),
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'No se pudo guardar el producto.');
        }

        estado.productoSeleccionado = resultado.datos;
        estado.copiaOriginal = { ...resultado.datos };
        estado.modo = 'consulta';

        cargarProductoEnFormulario(resultado.datos);
        elementos.busquedaInput.value = resultado.datos.codigo_barras;
        mostrarMensaje(resultado.mensaje, 'exito');
        actualizarEstadoFormulario('Operación completada correctamente.');
        await cargarProductos(resultado.datos.idProducto);
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

async function eliminarProducto(idProducto) {
    try {
        actualizarEstadoFormulario('Eliminando producto...');

        const respuesta = await fetch(`${API_URL}?idProducto=${encodeURIComponent(idProducto)}`, {
            method: 'DELETE',
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'No se pudo eliminar el producto.');
        }

        reiniciarFormulario();
        mostrarMensaje(resultado.mensaje, 'exito');
        actualizarEstadoFormulario('Producto eliminado.');
        await cargarProductos();
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

async function cargarProductos(idSeleccionado = null) {
    try {
        const respuesta = await fetch(API_URL);
        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'No se pudo cargar el listado.');
        }

        renderizarTabla(resultado.datos, idSeleccionado);
    } catch (error) {
        elementos.tablebody.innerHTML = `
            <tr>
                <td colspan="6" class="sin-registros">${error.message}</td>
            </tr>
        `;
    }
}

function renderizarTabla(productos, idSeleccionado = null) {
    if (!Array.isArray(productos) || productos.length === 0) {
        elementos.tablebody.innerHTML = `
            <tr>
                <td colspan="6" class="sin-registros">No hay productos registrados todavía.</td>
            </tr>
        `;
        return;
    }

    elementos.tablebody.innerHTML = productos.map((producto) => {
        const seleccionado = Number(idSeleccionado) === Number(producto.idProducto)
            || Number(estado.productoSeleccionado?.idProducto) === Number(producto.idProducto);

        return `
            <tr data-id="${producto.idProducto}" class="fila-producto ${seleccionado ? 'seleccionada' : ''}">
                <td>${producto.idProducto}</td>
                <td>${producto.codigo_barras}</td>
                <td>${escapeHtml(producto.nombre)}</td>
                <td>${Number(producto.precio).toFixed(2)}</td>
                <td>${producto.cantidad}</td>
                <td>${escapeHtml(producto.categoria)}</td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('.fila-producto').forEach((fila) => {
        fila.addEventListener('click', () => {
            const idProducto = Number(fila.dataset.id);
            const producto = productos.find((item) => Number(item.idProducto) === idProducto);

            if (!producto) {
                return;
            }

            estado.productoSeleccionado = producto;
            estado.copiaOriginal = { ...producto };
            estado.modo = 'consulta';
            cargarProductoEnFormulario(producto);
            elementos.busquedaInput.value = producto.codigo_barras;
            resaltarFilaSeleccionada(idProducto);
            mostrarMensaje('Producto seleccionado desde la tabla.', 'info');
            actualizarEstadoFormulario('Producto listo para consulta o edición.');
        });
    });
}

function resaltarFilaSeleccionada(idProducto) {
    document.querySelectorAll('.fila-producto').forEach((fila) => {
        const coincide = Number(fila.dataset.id) === Number(idProducto);
        fila.classList.toggle('seleccionada', coincide);
    });
}

function limpiarSeleccionTabla() {
    document.querySelectorAll('.fila-producto').forEach((fila) => {
        fila.classList.remove('seleccionada');
    });
}

function reiniciarFormulario() {
    estado.productoSeleccionado = null;
    estado.copiaOriginal = null;
    estado.modo = 'consulta';

    elementos.productForm.reset();
    elementos.idProducto.value = '';
    elementos.codigoBarra.value = '';
    elementos.busquedaInput.value = '';
    habilitarCampos(false);
    limpiarSeleccionTabla();
    actualizarEstadoFormulario('Esperando lectura o búsqueda de código de barras.');
}

function habilitarCampos(habilitado, permitirCodigo = false) {
    elementos.codigoBarra.disabled = !permitirCodigo;
    elementos.nombre.disabled = !habilitado;
    elementos.precio.disabled = !habilitado;
    elementos.stock.disabled = !habilitado;
    elementos.categoria.disabled = !habilitado;
    elementos.btnCancelarEdit.disabled = !habilitado;
}

function actualizarEstadoFormulario(texto) {
    elementos.estadoFormulario.textContent = texto;
}

function mostrarMensaje(texto, tipo = 'info') {
    elementos.mensajeEstado.textContent = texto;
    elementos.mensajeEstado.className = `mensaje mensaje-${tipo}`;
}

function escapeHtml(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
