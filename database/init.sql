CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY NOT NULL,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(250),
    id_categoria INTEGER NOT NULL,
    precio NUMERIC(6),
    stock NUMERIC(4),
    img TEXT,
    CONSTRAINT FK_id_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS carrito (
    user_cookie TEXT,
    id_prod INTEGER NOT NULL,
    cantidad NUMERIC(4),
    CONSTRAINT FK_id_prod FOREIGN KEY (id_prod) REFERENCES productos(id)
);