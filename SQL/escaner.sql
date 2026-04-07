CREATE DATABASE IF NOT EXISTS escaner;
USE escaner;

CREATE TABLE IF NOT EXISTS escaner (
    idProducto INT AUTO_INCREMENT PRIMARY KEY,
    codigo_barras BIGINT NOT NULL,
    nombre VARCHAR (150) NOT NULL,
    precio DECIMAL (20,4) NOT NULL,
    cantidad INT NOT NULL,
    categoria VARCHAR (50) NOT NULL
);