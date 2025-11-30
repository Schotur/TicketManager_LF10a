-- Rollen
INSERT INTO rolle (name, beschreibung) VALUES
('Admin', 'Systemadministrator mit allen Rechten'),
('Support', 'Bearbeitet Tickets'),
('Benutzer', 'Erstellt Tickets');

-- Kategorien
INSERT INTO kategorie (name, beschreibung) VALUES
('Technik', 'Technische Probleme'),
('Software', 'Softwarebezogene Anfragen'),
('Allgemein', 'Allgemeine Fragen');

-- Benutzer
INSERT INTO benutzer (vorname, nachname, email, passwort_hash, rolle_id, aktiv) VALUES
('Admin', 'Administrator', 'admin', 'admin', 1, TRUE),
('Support', 'Mitarbeiter', 'support', 'support', 2, TRUE),
('Max', 'Benutzer', 'benutzer', 'benutzer', 3, TRUE),
('Test', 'Nutzer', 'test@example.com', 'test', 3, TRUE);

-- Tickets
INSERT INTO ticket (titel, beschreibung, kategorie_id, erstellt_von, zugewiesen_an, erstellt_am, aktualisiert_am, status) VALUES
('Laptop startet nicht', 'Mein Laptop zeigt nur einen schwarzen Bildschirm.', 1, 3, 2, NOW(), NOW(), 'Offen'),
('Softwareinstallation', 'Ich benötige Hilfe bei der Installation von MS Office.', 2, 3, 2, NOW(), NOW(), 'In Bearbeitung'),
('Passwort vergessen', 'Ich habe mein Passwort vergessen und kann mich nicht anmelden.', 3, 3, 2, NOW(), NOW(), 'Gelöst');

-- Kommentare
INSERT INTO kommentar (ticket_id, benutzer_id, inhalt, erstellt_am) VALUES
(1, 2, 'Bitte prüfen Sie, ob das Gerät am Strom angeschlossen ist.', NOW()),
(2, 2, 'Ich habe Ihnen eine Anleitung zur Installation geschickt.', NOW()),
(3, 2, 'Das Passwort wurde zurückgesetzt. Bitte prüfen Sie Ihre E-Mails.', NOW());