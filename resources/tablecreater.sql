CREATE DATABASE IF NOT EXISTS ticket_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ticket_manager;

CREATE TABLE rolle 
(
	rolle_id INTEGER NOT NULL AUTO_INCREMENT,
	name VARCHAR(50) NOT NULL,
	beschreibung TEXT,
	PRIMARY KEY(rolle_id)
);

CREATE TABLE kategorie
(
	kategorie_id INTEGER NOT NULL AUTO_INCREMENT,
	name VARCHAR(50) NOT NULL,
	beschreibung TEXT,
	PRIMARY KEY(kategorie_id)
);

CREATE TABLE benutzer
(
	benutzer_id INTEGER NOT NULL AUTO_INCREMENT,
	vorname VARCHAR(50) NOT NULL,
	nachname VARCHAR(50) NOT NULL,
	email VARCHAR(50) NOT NULL,
	passwort_hash VARCHAR(50) NOT NULL,
	rolle_id INTEGER NOT NULL,
	aktiv BOOLEAN,
	PRIMARY KEY(benutzer_id),
	FOREIGN KEY(rolle_id) REFERENCES rolle(rolle_id)
);

CREATE TABLE ticket
(
	ticket_id INTEGER NOT NULL AUTO_INCREMENT,
	titel VARCHAR(50) NOT NULL,
	beschreibung TEXT,
	kategorie_id INTEGER NOT NULL,
	erstellt_von INTEGER NOT NULL,
	zugewiesen_an INTEGER,
	erstellt_am DATETIME,
	aktualisiert_am DATETIME,
	status VARCHAR(50),
	PRIMARY KEY(ticket_id),
	FOREIGN KEY(kategorie_id) REFERENCES kategorie(kategorie_id),
	FOREIGN KEY(erstellt_von) REFERENCES benutzer(benutzer_id),
	FOREIGN KEY(zugewiesen_an) REFERENCES benutzer(benutzer_id)
);

CREATE TABLE kommentar
(
	kommentar_id INTEGER NOT NULL AUTO_INCREMENT,
	ticket_id INTEGER NOT NULL,
	benutzer_id INTEGER NOT NULL,
	inhalt TEXT NOT NULL,
	erstellt_am DATETIME,
	PRIMARY KEY(kommentar_id),
	FOREIGN KEY(ticket_id) REFERENCES ticket(ticket_id),
	FOREIGN KEY(benutzer_id) REFERENCES benutzer(benutzer_id)
);