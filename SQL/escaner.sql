-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 08-04-2026 a las 00:20:09
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `escaner`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `escaner`
--

CREATE TABLE `escaner` (
  `idProducto` int(11) NOT NULL,
  `codigo_barras` bigint(20) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `precio` decimal(20,4) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `categoria` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `escaner`
--

INSERT INTO `escaner` (`idProducto`, `codigo_barras`, `nombre`, `precio`, `cantidad`, `categoria`) VALUES
(1, 71723121549, 'Cuaderno', 10.0000, 9, 'Cuaderno'),
(2, 7453000916735, 'Helado', 1.0000, 10, 'Dulce'),
(3, 2000021246560, 'Mascarilla', 1.5000, 15, 'Salud');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `escaner`
--
ALTER TABLE `escaner`
  ADD PRIMARY KEY (`idProducto`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `escaner`
--
ALTER TABLE `escaner`
  MODIFY `idProducto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
