--
-- PostgreSQL database dump
--

\restrict FFhQXef2Uti08BqCF1pD4d7yTikBRcu8NHr6DgmCZmyay8MPYRzMcaIZgZnM8lr

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Computadoras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Computadoras" (
    id_computadoras integer NOT NULL,
    modelo character varying(100),
    estado character varying(50),
    id_detalle_mant integer,
    tag_rfid character varying(100),
    activa boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Computadoras" OWNER TO postgres;

--
-- Name: Computadoras_id_computadoras_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Computadoras_id_computadoras_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Computadoras_id_computadoras_seq" OWNER TO postgres;

--
-- Name: Computadoras_id_computadoras_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Computadoras_id_computadoras_seq" OWNED BY public."Computadoras".id_computadoras;


--
-- Name: Persona; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Persona" (
    id_persona integer NOT NULL,
    nombre character varying(100),
    apellido character varying(100),
    dni character varying(20),
    correo character varying(100)
);


ALTER TABLE public."Persona" OWNER TO postgres;

--
-- Name: Persona_id_persona_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Persona_id_persona_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Persona_id_persona_seq" OWNER TO postgres;

--
-- Name: Persona_id_persona_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Persona_id_persona_seq" OWNED BY public."Persona".id_persona;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: alumnos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alumnos (
    id_alumnos integer NOT NULL,
    id_computadoras integer,
    id_persona integer,
    id_carrera integer
);


ALTER TABLE public.alumnos OWNER TO postgres;

--
-- Name: alumnos_id_alumnos_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alumnos_id_alumnos_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alumnos_id_alumnos_seq OWNER TO postgres;

--
-- Name: alumnos_id_alumnos_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alumnos_id_alumnos_seq OWNED BY public.alumnos.id_alumnos;


--
-- Name: camaras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camaras (
    id_camara integer NOT NULL,
    nombre character varying(100) NOT NULL,
    ubicacion character varying(200) NOT NULL,
    ip character varying(45) NOT NULL,
    activa boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.camaras OWNER TO postgres;

--
-- Name: camaras_id_camara_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camaras_id_camara_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camaras_id_camara_seq OWNER TO postgres;

--
-- Name: camaras_id_camara_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camaras_id_camara_seq OWNED BY public.camaras.id_camara;


--
-- Name: carreras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carreras (
    id_carrera integer NOT NULL,
    nombre character varying(100),
    "año" character varying(10)
);


ALTER TABLE public.carreras OWNER TO postgres;

--
-- Name: carreras_id_carrera_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carreras_id_carrera_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carreras_id_carrera_seq OWNER TO postgres;

--
-- Name: carreras_id_carrera_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carreras_id_carrera_seq OWNED BY public.carreras.id_carrera;


--
-- Name: detalle_mant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_mant (
    id_detalle_mant integer NOT NULL,
    descripcion character varying(200)
);


ALTER TABLE public.detalle_mant OWNER TO postgres;

--
-- Name: detalle_mant_id_detalle_mant_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_mant_id_detalle_mant_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_mant_id_detalle_mant_seq OWNER TO postgres;

--
-- Name: detalle_mant_id_detalle_mant_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_mant_id_detalle_mant_seq OWNED BY public.detalle_mant.id_detalle_mant;


--
-- Name: eventos_acceso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos_acceso (
    id_evento integer NOT NULL,
    camara_id integer NOT NULL,
    persona_id integer,
    tipo_evento character varying(50) NOT NULL,
    imagen_url character varying(500),
    confianza_ia double precision,
    resultado character varying(20) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.eventos_acceso OWNER TO postgres;

--
-- Name: eventos_acceso_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eventos_acceso_id_evento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventos_acceso_id_evento_seq OWNER TO postgres;

--
-- Name: eventos_acceso_id_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eventos_acceso_id_evento_seq OWNED BY public.eventos_acceso.id_evento;


--
-- Name: imagen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imagen (
    id_imagen integer NOT NULL,
    carga_imagen character varying(200)
);


ALTER TABLE public.imagen OWNER TO postgres;

--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imagen_id_imagen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imagen_id_imagen_seq OWNER TO postgres;

--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imagen_id_imagen_seq OWNED BY public.imagen.id_imagen;


--
-- Name: lectura_rfid; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lectura_rfid (
    id integer NOT NULL,
    tag_rfid character varying(100) NOT NULL,
    id_computadoras integer,
    lector_origen character varying(100),
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lectura_rfid OWNER TO postgres;

--
-- Name: lectura_rfid_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lectura_rfid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lectura_rfid_id_seq OWNER TO postgres;

--
-- Name: lectura_rfid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lectura_rfid_id_seq OWNED BY public.lectura_rfid.id;


--
-- Name: preceptor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preceptor (
    id_preceptor integer NOT NULL,
    id_persona integer,
    id_carrera integer,
    id_imagen integer
);


ALTER TABLE public.preceptor OWNER TO postgres;

--
-- Name: preceptor_id_preceptor_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preceptor_id_preceptor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preceptor_id_preceptor_seq OWNER TO postgres;

--
-- Name: preceptor_id_preceptor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preceptor_id_preceptor_seq OWNED BY public.preceptor.id_preceptor;


--
-- Name: rfid_eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfid_eventos (
    id integer NOT NULL,
    tag_rfid character varying(100) NOT NULL,
    lector_id integer,
    tipo_evento character varying(50) NOT NULL,
    detalles json,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rfid_eventos OWNER TO postgres;

--
-- Name: rfid_eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfid_eventos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfid_eventos_id_seq OWNER TO postgres;

--
-- Name: rfid_eventos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfid_eventos_id_seq OWNED BY public.rfid_eventos.id;


--
-- Name: rfid_lectores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfid_lectores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    ubicacion character varying(200) NOT NULL,
    ip character varying(45),
    activo boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rfid_lectores OWNER TO postgres;

--
-- Name: rfid_lectores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfid_lectores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfid_lectores_id_seq OWNER TO postgres;

--
-- Name: rfid_lectores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfid_lectores_id_seq OWNED BY public.rfid_lectores.id;


--
-- Name: rfid_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfid_tags (
    id integer NOT NULL,
    tag_rfid character varying(100) NOT NULL,
    tipo character varying(50) NOT NULL,
    estado character varying(50) NOT NULL,
    id_computadoras integer,
    fecha_asignacion timestamp with time zone,
    fecha_baja timestamp with time zone,
    notas character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rfid_tags OWNER TO postgres;

--
-- Name: rfid_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfid_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfid_tags_id_seq OWNER TO postgres;

--
-- Name: rfid_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfid_tags_id_seq OWNED BY public.rfid_tags.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(20) DEFAULT 'preceptor'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    id_persona integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: Computadoras id_computadoras; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Computadoras" ALTER COLUMN id_computadoras SET DEFAULT nextval('public."Computadoras_id_computadoras_seq"'::regclass);


--
-- Name: Persona id_persona; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Persona" ALTER COLUMN id_persona SET DEFAULT nextval('public."Persona_id_persona_seq"'::regclass);


--
-- Name: alumnos id_alumnos; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos ALTER COLUMN id_alumnos SET DEFAULT nextval('public.alumnos_id_alumnos_seq'::regclass);


--
-- Name: camaras id_camara; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camaras ALTER COLUMN id_camara SET DEFAULT nextval('public.camaras_id_camara_seq'::regclass);


--
-- Name: carreras id_carrera; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carreras ALTER COLUMN id_carrera SET DEFAULT nextval('public.carreras_id_carrera_seq'::regclass);


--
-- Name: detalle_mant id_detalle_mant; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_mant ALTER COLUMN id_detalle_mant SET DEFAULT nextval('public.detalle_mant_id_detalle_mant_seq'::regclass);


--
-- Name: eventos_acceso id_evento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_acceso ALTER COLUMN id_evento SET DEFAULT nextval('public.eventos_acceso_id_evento_seq'::regclass);


--
-- Name: imagen id_imagen; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagen ALTER COLUMN id_imagen SET DEFAULT nextval('public.imagen_id_imagen_seq'::regclass);


--
-- Name: lectura_rfid id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lectura_rfid ALTER COLUMN id SET DEFAULT nextval('public.lectura_rfid_id_seq'::regclass);


--
-- Name: preceptor id_preceptor; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preceptor ALTER COLUMN id_preceptor SET DEFAULT nextval('public.preceptor_id_preceptor_seq'::regclass);


--
-- Name: rfid_eventos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_eventos ALTER COLUMN id SET DEFAULT nextval('public.rfid_eventos_id_seq'::regclass);


--
-- Name: rfid_lectores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_lectores ALTER COLUMN id SET DEFAULT nextval('public.rfid_lectores_id_seq'::regclass);


--
-- Name: rfid_tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_tags ALTER COLUMN id SET DEFAULT nextval('public.rfid_tags_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: Computadoras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Computadoras" (id_computadoras, modelo, estado, id_detalle_mant, tag_rfid, activa) FROM stdin;
1	Dell Optiplex 3080	en_reparacion	\N	RFID-001	f
2	HP ProBook 450	\N	\N	RFID-002	t
\.


--
-- Data for Name: Persona; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Persona" (id_persona, nombre, apellido, dni, correo) FROM stdin;
1	Fiorela	Torres	12345678	Fiorela.torres@email.com
2	Ivana	Insaurralde	44225502	ivana.insaurralde@email.com
3	Carlos	Gimenez	30123456	cgimenez@ipf.edu.ar
4	Maria	Lopez	27123123	mlopez@ipf.edu.ar
5	Jose	Fernandez	33456789	jfernandez@ipf.edu.ar
6	Ana	Martinez	28987456	amartinez@ipf.edu.ar
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
90e20021f301
\.


--
-- Data for Name: alumnos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alumnos (id_alumnos, id_computadoras, id_persona, id_carrera) FROM stdin;
\.


--
-- Data for Name: camaras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.camaras (id_camara, nombre, ubicacion, ip, activa, created_at) FROM stdin;
1	Entrada Principal	Acceso principal edificio	192.168.1.100	t	2026-05-30 20:11:38.545854-03
2	Laboratorio de Informatica	2do piso - Ala norte	192.168.1.101	t	2026-05-30 20:11:38.545854-03
3	Laboratorio de Electronica	3er piso - Ala sur	192.168.1.102	t	2026-05-30 20:11:38.545854-03
4	Biblioteca	Planta baja	192.168.1.103	t	2026-05-30 20:11:38.545854-03
5	Sala de Profesores	1er piso	192.168.1.104	t	2026-05-30 20:11:38.545854-03
\.


--
-- Data for Name: carreras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carreras (id_carrera, nombre, "año") FROM stdin;
\.


--
-- Data for Name: detalle_mant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_mant (id_detalle_mant, descripcion) FROM stdin;
\.


--
-- Data for Name: eventos_acceso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos_acceso (id_evento, camara_id, persona_id, tipo_evento, imagen_url, confianza_ia, resultado, "timestamp") FROM stdin;
1	1	3	ingreso	\N	0.92	autorizado	2026-05-30 20:11:38.577653-03
2	1	4	ingreso	\N	0.88	autorizado	2026-05-30 19:11:38.577653-03
3	2	3	ingreso	\N	0.95	autorizado	2026-05-30 20:11:38.577653-03
4	3	5	ingreso	\N	0.61	denegado	2026-05-30 20:11:38.577653-03
5	1	\N	ingreso	\N	0.43	denegado	2026-05-30 18:11:38.577653-03
6	4	4	ingreso	\N	0.97	autorizado	2026-05-30 20:11:38.577653-03
7	1	3	egreso	\N	0.91	autorizado	2026-05-30 17:11:38.577653-03
8	5	6	ingreso	\N	0.89	autorizado	2026-05-30 20:11:38.577653-03
9	2	5	ingreso	\N	0.55	denegado	2026-05-30 19:11:38.577653-03
10	3	3	ingreso	\N	0.93	autorizado	2026-05-30 19:11:38.577653-03
11	1	3	ingreso	\N	0.92	autorizado	2026-05-30 20:11:39.124848-03
12	1	4	ingreso	\N	0.88	autorizado	2026-05-30 19:11:39.124848-03
13	2	3	ingreso	\N	0.95	autorizado	2026-05-30 20:11:39.124848-03
14	3	5	ingreso	\N	0.61	denegado	2026-05-30 20:11:39.124848-03
15	1	\N	ingreso	\N	0.43	denegado	2026-05-30 18:11:39.124848-03
16	4	4	ingreso	\N	0.97	autorizado	2026-05-30 20:11:39.124848-03
17	1	3	egreso	\N	0.91	autorizado	2026-05-30 17:11:39.124848-03
18	5	6	ingreso	\N	0.89	autorizado	2026-05-30 20:11:39.124848-03
19	2	5	ingreso	\N	0.55	denegado	2026-05-30 19:11:39.124848-03
20	3	3	ingreso	\N	0.93	autorizado	2026-05-30 19:11:39.124848-03
21	1	3	ingreso	\N	0.92	autorizado	2026-05-30 20:12:13.359486-03
22	1	4	ingreso	\N	0.88	autorizado	2026-05-30 19:12:13.359486-03
23	2	3	ingreso	\N	0.95	autorizado	2026-05-30 20:12:13.359486-03
24	3	5	ingreso	\N	0.61	denegado	2026-05-30 20:12:13.359486-03
25	1	\N	ingreso	\N	0.43	denegado	2026-05-30 18:12:13.359486-03
26	4	4	ingreso	\N	0.97	autorizado	2026-05-30 20:12:13.359486-03
27	1	3	egreso	\N	0.91	autorizado	2026-05-30 17:12:13.359486-03
28	5	6	ingreso	\N	0.89	autorizado	2026-05-30 20:12:13.359486-03
29	2	5	ingreso	\N	0.55	denegado	2026-05-30 19:12:13.359486-03
30	3	3	ingreso	\N	0.93	autorizado	2026-05-30 19:12:13.359486-03
\.


--
-- Data for Name: imagen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imagen (id_imagen, carga_imagen) FROM stdin;
\.


--
-- Data for Name: lectura_rfid; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lectura_rfid (id, tag_rfid, id_computadoras, lector_origen, "timestamp") FROM stdin;
1	RFID-002	2	Lector-Puerta-1	2026-05-28 10:39:14.219668-03
2	RFID-DESCONOCIDO	\N	Lector-Puerta-1	2026-05-28 10:39:14.241157-03
\.


--
-- Data for Name: preceptor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preceptor (id_preceptor, id_persona, id_carrera, id_imagen) FROM stdin;
\.


--
-- Data for Name: rfid_eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfid_eventos (id, tag_rfid, lector_id, tipo_evento, detalles, "timestamp") FROM stdin;
\.


--
-- Data for Name: rfid_lectores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfid_lectores (id, nombre, ubicacion, ip, activo, created_at) FROM stdin;
\.


--
-- Data for Name: rfid_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfid_tags (id, tag_rfid, tipo, estado, id_computadoras, fecha_asignacion, fecha_baja, notas, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, password_hash, rol, activo, id_persona, created_at, updated_at) FROM stdin;
1	admin@test.com	admin	$2b$12$as3o/RXghMNhD67YFpK.mu9mZ4sbtzxZG6yl0jOCyMSYf08Lf1WUy	admin	t	\N	2026-05-24 16:40:36.702637-03	2026-06-26 15:58:05.936684-03
2	preceptor@test.com	preceptor	$2b$12$doF602q8c0P9LA2fkwMJYu1sqbVHApE4T.y.5O3l8BPTd8wG34/ze	preceptor	t	\N	2026-05-24 16:40:37.171107-03	2026-06-26 15:58:05.936684-03
\.


--
-- Name: Computadoras_id_computadoras_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Computadoras_id_computadoras_seq"', 2, true);


--
-- Name: Persona_id_persona_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Persona_id_persona_seq"', 6, true);


--
-- Name: alumnos_id_alumnos_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alumnos_id_alumnos_seq', 1, false);


--
-- Name: camaras_id_camara_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.camaras_id_camara_seq', 5, true);


--
-- Name: carreras_id_carrera_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carreras_id_carrera_seq', 1, false);


--
-- Name: detalle_mant_id_detalle_mant_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_mant_id_detalle_mant_seq', 1, false);


--
-- Name: eventos_acceso_id_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eventos_acceso_id_evento_seq', 30, true);


--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imagen_id_imagen_seq', 1, false);


--
-- Name: lectura_rfid_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lectura_rfid_id_seq', 2, true);


--
-- Name: preceptor_id_preceptor_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preceptor_id_preceptor_seq', 1, false);


--
-- Name: rfid_eventos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfid_eventos_id_seq', 1, false);


--
-- Name: rfid_lectores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfid_lectores_id_seq', 1, false);


--
-- Name: rfid_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfid_tags_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: Computadoras Computadoras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Computadoras"
    ADD CONSTRAINT "Computadoras_pkey" PRIMARY KEY (id_computadoras);


--
-- Name: Persona Persona_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Persona"
    ADD CONSTRAINT "Persona_correo_key" UNIQUE (correo);


--
-- Name: Persona Persona_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Persona"
    ADD CONSTRAINT "Persona_dni_key" UNIQUE (dni);


--
-- Name: Persona Persona_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Persona"
    ADD CONSTRAINT "Persona_pkey" PRIMARY KEY (id_persona);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: alumnos alumnos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_pkey PRIMARY KEY (id_alumnos);


--
-- Name: camaras camaras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camaras
    ADD CONSTRAINT camaras_pkey PRIMARY KEY (id_camara);


--
-- Name: carreras carreras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carreras
    ADD CONSTRAINT carreras_pkey PRIMARY KEY (id_carrera);


--
-- Name: detalle_mant detalle_mant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_mant
    ADD CONSTRAINT detalle_mant_pkey PRIMARY KEY (id_detalle_mant);


--
-- Name: eventos_acceso eventos_acceso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_acceso
    ADD CONSTRAINT eventos_acceso_pkey PRIMARY KEY (id_evento);


--
-- Name: imagen imagen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagen
    ADD CONSTRAINT imagen_pkey PRIMARY KEY (id_imagen);


--
-- Name: lectura_rfid lectura_rfid_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lectura_rfid
    ADD CONSTRAINT lectura_rfid_pkey PRIMARY KEY (id);


--
-- Name: preceptor preceptor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preceptor
    ADD CONSTRAINT preceptor_pkey PRIMARY KEY (id_preceptor);


--
-- Name: rfid_eventos rfid_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_eventos
    ADD CONSTRAINT rfid_eventos_pkey PRIMARY KEY (id);


--
-- Name: rfid_lectores rfid_lectores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_lectores
    ADD CONSTRAINT rfid_lectores_pkey PRIMARY KEY (id);


--
-- Name: rfid_tags rfid_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_tags
    ADD CONSTRAINT rfid_tags_pkey PRIMARY KEY (id);


--
-- Name: Computadoras uq_computadoras_tag_rfid; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Computadoras"
    ADD CONSTRAINT uq_computadoras_tag_rfid UNIQUE (tag_rfid);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: ix_lectura_rfid_tag_rfid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_lectura_rfid_tag_rfid ON public.lectura_rfid USING btree (tag_rfid);


--
-- Name: ix_rfid_eventos_tag_rfid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_rfid_eventos_tag_rfid ON public.rfid_eventos USING btree (tag_rfid);


--
-- Name: ix_rfid_tags_tag_rfid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_rfid_tags_tag_rfid ON public.rfid_tags USING btree (tag_rfid);


--
-- Name: Computadoras FK_Computadoras_id_detalle_mant; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Computadoras"
    ADD CONSTRAINT "FK_Computadoras_id_detalle_mant" FOREIGN KEY (id_detalle_mant) REFERENCES public.detalle_mant(id_detalle_mant);


--
-- Name: alumnos FK_alumnos_id_carrera; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT "FK_alumnos_id_carrera" FOREIGN KEY (id_carrera) REFERENCES public.carreras(id_carrera);


--
-- Name: alumnos FK_alumnos_id_computadoras; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT "FK_alumnos_id_computadoras" FOREIGN KEY (id_computadoras) REFERENCES public."Computadoras"(id_computadoras);


--
-- Name: alumnos FK_alumnos_id_persona; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT "FK_alumnos_id_persona" FOREIGN KEY (id_persona) REFERENCES public."Persona"(id_persona);


--
-- Name: preceptor FK_preceptor_id_carrera; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preceptor
    ADD CONSTRAINT "FK_preceptor_id_carrera" FOREIGN KEY (id_carrera) REFERENCES public.carreras(id_carrera);


--
-- Name: preceptor FK_preceptor_id_imagen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preceptor
    ADD CONSTRAINT "FK_preceptor_id_imagen" FOREIGN KEY (id_imagen) REFERENCES public.imagen(id_imagen);


--
-- Name: preceptor FK_preceptor_id_persona; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preceptor
    ADD CONSTRAINT "FK_preceptor_id_persona" FOREIGN KEY (id_persona) REFERENCES public."Persona"(id_persona);


--
-- Name: eventos_acceso eventos_acceso_camara_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_acceso
    ADD CONSTRAINT eventos_acceso_camara_id_fkey FOREIGN KEY (camara_id) REFERENCES public.camaras(id_camara);


--
-- Name: eventos_acceso eventos_acceso_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_acceso
    ADD CONSTRAINT eventos_acceso_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public."Persona"(id_persona);


--
-- Name: users fk_users_id_persona; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_id_persona FOREIGN KEY (id_persona) REFERENCES public."Persona"(id_persona);


--
-- Name: lectura_rfid lectura_rfid_id_computadoras_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lectura_rfid
    ADD CONSTRAINT lectura_rfid_id_computadoras_fkey FOREIGN KEY (id_computadoras) REFERENCES public."Computadoras"(id_computadoras);


--
-- Name: rfid_eventos rfid_eventos_lector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_eventos
    ADD CONSTRAINT rfid_eventos_lector_id_fkey FOREIGN KEY (lector_id) REFERENCES public.rfid_lectores(id);


--
-- Name: rfid_tags rfid_tags_id_computadoras_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfid_tags
    ADD CONSTRAINT rfid_tags_id_computadoras_fkey FOREIGN KEY (id_computadoras) REFERENCES public."Computadoras"(id_computadoras);


--
-- PostgreSQL database dump complete
--

\unrestrict FFhQXef2Uti08BqCF1pD4d7yTikBRcu8NHr6DgmCZmyay8MPYRzMcaIZgZnM8lr

