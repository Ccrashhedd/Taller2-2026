<?php

declare(strict_types=1);

class Conexion
{
    private const HOST = 'localhost';
    private const DBNAME = 'escaner';
    private const USER = 'root';
    private const PASSWORD = '';
    private const CHARSET = 'utf8mb4';

    public static function conectar(): PDO
    {
        $dsn = 'mysql:host=' . self::HOST . ';dbname=' . self::DBNAME . ';charset=' . self::CHARSET;

        return new PDO($dsn, self::USER, self::PASSWORD, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
}
