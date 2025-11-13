DROP TABLE IF EXISTS publicacoes, oportunidades, noticias, usuarios;

CREATE TABLE noticias (
  idnoticia SERIAL,
  titulo VARCHAR(250) NULL,
  link VARCHAR(250) NULL,
  postagem DATE NULL,
  exibir BOOL NULL,
  filepath VARCHAR(250) NULL,
  PRIMARY KEY(idnoticia)
);

CREATE TABLE oportunidades (
  idoportunidade SERIAL,
  titulo VARCHAR(250) NULL,
  descricao TEXT NULL,
  validade DATE NULL,
  exibir BOOL NULL,
  PRIMARY KEY(idoportunidade)
);

CREATE TABLE publicacoes (
  idpublicacao SERIAL,
  texto TEXT NULL,
  ano INTEGER NULL,
  link VARCHAR(250) NULL,
  doi VARCHAR(250) NULL,
  filepath VARCHAR(250) NULL,
  PRIMARY KEY(idpublicacao)
);

CREATE TABLE usuarios (
  idusuario SERIAL,
  mail VARCHAR(100) NOT NULL,
  senha VARCHAR(100) NOT NULL,
  PRIMARY KEY(idusuario)
);

INSERT INTO usuarios (mail,senha)
VALUES ('root@inpe.br','123456');
