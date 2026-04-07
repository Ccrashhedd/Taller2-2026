<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/conexion.php';

function responder(bool $ok, string $mensaje, mixed $datos = null, int $codigoHttp = 200): never
{
    http_response_code($codigoHttp);
    echo json_encode([
        'ok' => $ok,
        'mensaje' => $mensaje,
        'datos' => $datos,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function leerEntradaJson(): array
{
    $contenido = file_get_contents('php://input');

    if ($contenido === false || trim($contenido) === '') {
        return [];
    }

    $datos = json_decode($contenido, true);

    if (!is_array($datos)) {
        responder(false, 'El cuerpo de la petición no contiene un JSON válido.', null, 400);
    }

    return $datos;
}

function limpiarTexto(?string $valor): string
{
    return trim((string) $valor);
}

function validarProducto(array $datos, bool $esActualizacion = false): array
{
    $idProducto = isset($datos['idProducto']) ? (int) $datos['idProducto'] : 0;
    $codigoBarras = limpiarTexto($datos['codigo_barras'] ?? $datos['codigoBarra'] ?? '');
    $nombre = limpiarTexto($datos['nombre'] ?? '');
    $precio = $datos['precio'] ?? null;
    $cantidad = $datos['cantidad'] ?? $datos['stock'] ?? null;
    $categoria = limpiarTexto($datos['categoria'] ?? '');

    if ($esActualizacion && $idProducto <= 0) {
        responder(false, 'Debes indicar un idProducto válido para actualizar.', null, 400);
    }

    if ($codigoBarras === '' || !preg_match('/^\d{6,18}$/', $codigoBarras)) {
        responder(false, 'El código de barras debe contener solo números y tener entre 6 y 18 dígitos.', null, 400);
    }

    if ($nombre === '' || mb_strlen($nombre) < 2 || mb_strlen($nombre) > 150) {
        responder(false, 'El nombre del producto debe tener entre 2 y 150 caracteres.', null, 400);
    }

    if (!is_numeric((string) $precio) || (float) $precio < 0) {
        responder(false, 'El precio debe ser un número válido mayor o igual a 0.', null, 400);
    }

    if (filter_var($cantidad, FILTER_VALIDATE_INT) === false || (int) $cantidad < 0) {
        responder(false, 'La cantidad debe ser un número entero mayor o igual a 0.', null, 400);
    }

    if ($categoria === '' || mb_strlen($categoria) < 2 || mb_strlen($categoria) > 50) {
        responder(false, 'La categoría debe tener entre 2 y 50 caracteres.', null, 400);
    }

    return [
        'idProducto' => $idProducto,
        'codigo_barras' => $codigoBarras,
        'nombre' => $nombre,
        'precio' => number_format((float) $precio, 4, '.', ''),
        'cantidad' => (int) $cantidad,
        'categoria' => $categoria,
    ];
}

try {
    $pdo = Conexion::conectar();
    $metodo = $_SERVER['REQUEST_METHOD'];

    switch ($metodo) {
        case 'GET':
            $idProducto = isset($_GET['idProducto']) ? (int) $_GET['idProducto'] : 0;
            $codigoBarras = limpiarTexto($_GET['codigo_barras'] ?? '');

            if ($idProducto > 0) {
                $stmt = $pdo->prepare('SELECT idProducto, codigo_barras, nombre, precio, cantidad, categoria FROM escaner WHERE idProducto = :idProducto');
                $stmt->execute([':idProducto' => $idProducto]);
                $producto = $stmt->fetch();

                if (!$producto) {
                    responder(false, 'No se encontró el producto solicitado.', null, 404);
                }

                responder(true, 'Producto encontrado.', $producto);
            }

            if ($codigoBarras !== '') {
                if (!preg_match('/^\d{6,18}$/', $codigoBarras)) {
                    responder(false, 'El código de barras consultado no es válido.', null, 400);
                }

                $stmt = $pdo->prepare('SELECT idProducto, codigo_barras, nombre, precio, cantidad, categoria FROM escaner WHERE codigo_barras = :codigo_barras LIMIT 1');
                $stmt->execute([':codigo_barras' => $codigoBarras]);
                $producto = $stmt->fetch();

                if (!$producto) {
                    responder(false, 'No existe un producto registrado con ese código de barras.', null, 404);
                }

                responder(true, 'Producto encontrado.', $producto);
            }

            $stmt = $pdo->query('SELECT idProducto, codigo_barras, nombre, precio, cantidad, categoria FROM escaner WHERE cantidad > 0 ORDER BY idProducto ASC');
            $productos = $stmt->fetchAll();
            responder(true, 'Listado de productos obtenido correctamente.', $productos);
            break;

        case 'POST':
            $datos = validarProducto(leerEntradaJson(), false);

            $stmt = $pdo->prepare('SELECT COUNT(*) FROM escaner WHERE codigo_barras = :codigo_barras');
            $stmt->execute([':codigo_barras' => $datos['codigo_barras']]);
            $existeCodigo = (int) $stmt->fetchColumn();

            if ($existeCodigo > 0) {
                responder(false, 'Ya existe un producto con ese código de barras.', null, 409);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO escaner (codigo_barras, nombre, precio, cantidad, categoria)
                 VALUES (:codigo_barras, :nombre, :precio, :cantidad, :categoria)'
            );

            $stmt->execute([
                ':codigo_barras' => $datos['codigo_barras'],
                ':nombre' => $datos['nombre'],
                ':precio' => $datos['precio'],
                ':cantidad' => $datos['cantidad'],
                ':categoria' => $datos['categoria'],
            ]);

            $idNuevo = (int) $pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT idProducto, codigo_barras, nombre, precio, cantidad, categoria FROM escaner WHERE idProducto = :idProducto');
            $stmt->execute([':idProducto' => $idNuevo]);

            responder(true, 'Producto registrado correctamente.', $stmt->fetch(), 201);
            break;

        case 'PUT':
            $datos = validarProducto(leerEntradaJson(), true);

            $stmt = $pdo->prepare('SELECT COUNT(*) FROM escaner WHERE idProducto = :idProducto');
            $stmt->execute([':idProducto' => $datos['idProducto']]);
            $existeProducto = (int) $stmt->fetchColumn();

            if ($existeProducto === 0) {
                responder(false, 'No se puede actualizar porque el producto no existe.', null, 404);
            }

            $stmt = $pdo->prepare('SELECT COUNT(*) FROM escaner WHERE codigo_barras = :codigo_barras AND idProducto <> :idProducto');
            $stmt->execute([
                ':codigo_barras' => $datos['codigo_barras'],
                ':idProducto' => $datos['idProducto'],
            ]);
            $codigoDuplicado = (int) $stmt->fetchColumn();

            if ($codigoDuplicado > 0) {
                responder(false, 'Ese código de barras ya está siendo usado por otro producto.', null, 409);
            }

            $stmt = $pdo->prepare(
                'UPDATE escaner
                 SET codigo_barras = :codigo_barras,
                     nombre = :nombre,
                     precio = :precio,
                     cantidad = :cantidad,
                     categoria = :categoria
                 WHERE idProducto = :idProducto'
            );

            $stmt->execute([
                ':codigo_barras' => $datos['codigo_barras'],
                ':nombre' => $datos['nombre'],
                ':precio' => $datos['precio'],
                ':cantidad' => $datos['cantidad'],
                ':categoria' => $datos['categoria'],
                ':idProducto' => $datos['idProducto'],
            ]);

            $stmt = $pdo->prepare('SELECT idProducto, codigo_barras, nombre, precio, cantidad, categoria FROM escaner WHERE idProducto = :idProducto');
            $stmt->execute([':idProducto' => $datos['idProducto']]);

            responder(true, 'Producto actualizado correctamente.', $stmt->fetch());
            break;

        case 'DELETE':
            $datosDelete = leerEntradaJson();
            $idProducto = isset($_GET['idProducto']) ? (int) $_GET['idProducto'] : (int) ($datosDelete['idProducto'] ?? 0);

            if ($idProducto <= 0) {
                responder(false, 'Debes indicar un idProducto válido para eliminar.', null, 400);
            }

            $stmt = $pdo->prepare('SELECT COUNT(*) FROM escaner WHERE idProducto = :idProducto');
            $stmt->execute([':idProducto' => $idProducto]);
            $existeProducto = (int) $stmt->fetchColumn();

            if ($existeProducto === 0) {
                responder(false, 'No se puede eliminar porque el producto no existe.', null, 404);
            }

            $stmt = $pdo->prepare('UPDATE escaner SET cantidad = 0 WHERE idProducto = :idProducto');
            $stmt->execute([':idProducto' => $idProducto]);

            responder(true, 'Producto eliminado correctamente. Ahora tiene cantidad 0 y ya no se mostrará en la tabla.');
            break;

        default:
            responder(false, 'Método HTTP no permitido.', null, 405);
    }
} catch (PDOException $e) {
    responder(false, 'Error de base de datos: ' . $e->getMessage(), null, 500);
} catch (Throwable $e) {
    responder(false, 'Error interno del servidor: ' . $e->getMessage(), null, 500);
}
