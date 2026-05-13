# IM4_BrushBuddy

# BrushBuddy – Sensorprojekt Dokumentation

Dieses Projekt erfasst Zahnputzsessions von Kindern mithilfe zweier ESP32-C6 Controller und speichert die Daten in einer externen Datenbank. Ein LED-Ring zeigt den Fortschritt in Echtzeit an.

---

## Systemübersicht

```
[ICM-20948 Sensor]
       │ I2C
[ESP32 Sensorcontroller]  ──HTTP──►  [ESP32 Basecontroller]  ──HTTPS──►  [Datenbank]
    (Batterie)                 WiFi AP       (USB/Laptop)       Heimnetz/Hotspot
                                         [NeoPixel 12 LEDs]
```

**Sensorcontroller**: Erkennt Bewegung der Zahnbürste, sendet Heartbeats per HTTP an den Basecontroller.

**Basecontroller**: Empfängt Heartbeats, steuert den LED-Ring, sendet abgeschlossene Sessions an die Datenbank.

---

## Umsetzungsprozess und Schwierigkeiten

### 1. Netzwerkarchitektur: AP+STA Dual-Mode

Die grösste konzeptionelle Herausforderung war die Frage, wie der Basecontroller gleichzeitig als Access Point für den Sensorcontroller und als Client im Heimnetz (für den Datenbankzugang) funktionieren kann.

Der ESP32-C6 unterstützt nativ den sogenannten **AP+STA Dual-Mode**: Er erstellt sein eigenes WLAN-Netzwerk (Access Point) und verbindet sich gleichzeitig als Station (STA) mit einem bestehenden Router. Beide Rollen teilen sich dieselbe Funkantenne, was automatisch koordiniert wird.

```cpp
WiFi.mode(WIFI_AP_STA);        // Beide Modi gleichzeitig aktivieren
WiFi.softAP(AP_SSID, AP_PASSWORD);  // Access Point starten
WiFi.begin(STA_SSID, STA_PASSWORD); // Mit Heimnetz verbinden
```

Der Sensorcontroller verbindet sich mit dem AP des Basecontrollers (feste IP `192.168.4.1`) und sendet seine Heartbeats dorthin. Der Basecontroller leitet fertige Sessions über das Heimnetz an die externe Datenbank weiter.

**Wichtig**: Die IP `192.168.4.1` ist im ESP32-Framework fest vorgegeben und muss nicht konfiguriert werden.

---

### 2. Mehrere Netzwerke (Multi-WiFi)

Um den Basecontroller flexibel einsetzen zu können, wurde eine Listenstruktur implementiert. Der Controller testet beim Start jedes eingetragene Netzwerk der Reihe nach und verbindet sich mit dem ersten verfügbaren:

```cpp
struct WiFiCredentials { const char* ssid; const char* password; };
WiFiCredentials wifiList[] = {
  { "Heimnetz",  "passwort1" },
  { "Hotspot",   "passwort2" },
};
```

So muss der Code nicht jedes Mal angepasst werden wenn der Einsatzort wechselt.
Da hat uns Siro mit einem alten Projekt helfen können.

---

### 3. IMU nicht gefunden

Beim ersten Start meldete der Sensorcontroller `IMU nicht gefunden`, obwohl die Verkabelung korrekt war. Ein I2C-Scanner bestätigte, dass der Sensor auf Adresse `0x68` antwortet. Das Problem lag an der I2C-Taktgeschwindigkeit: Der ESP32-C6 startet standardmässig mit 400kHz, was beim ICM-20948 beim Hochfahren zu Kommunikationsfehlern führte.

**Lösung**: I2C-Takt auf 100kHz reduzieren und dem Sensor mehr Startzeit geben:

```cpp
Wire.begin(SDA_PIN, SCL_PIN);
Wire.setClock(100000);
delay(250);
```

---

### 4. Upload-Fehler: Failed to write to target RAM

Beim Hochladen auf einen der ESP32-C6 erschien folgender Fehler:
```
A fatal error occurred: Failed to write to target RAM (result was 0107: Checksum error)
```

Der ESP32 befand sich nicht im Bootloader-Modus. Lösung: **BOOT-Taste gedrückt halten**, dann kurz **RESET drücken**, dann BOOT loslassen – danach sofort hochladen. Zusätzlich half es, die Upload-Geschwindigkeit in Arduino IDE auf 460800 zu reduzieren (`Werkzeuge → Upload Speed`).
Das Ganze begleitete uns aber durchs gesamte Projekt und war extrem mühsam und frustrierend. Auch mix dem Fix kam es immer wieder vor, dass der Fehler ausgegeben wurde. Daran sind wir fast zerbrochen.
---

### 5. Timestamp-Format

Das externe Team erwartete Zeitstempel im Format `2026-05-12 14:00:00` (MySQL DATETIME), während der ESP32 anfänglich ISO-8601 (`2026-05-12T14:00:00Z`) sendete. Die Funktion `getTimestamp()` wurde entsprechend angepasst:

```cpp
strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", t);
```

---

### 6. Authentifizierung mit Token

Das externe Team sichert den API-Endpoint mit einem statischen Token, der bei jeder Anfrage im JSON-Body mitgesendet werden muss. Ohne gültigen Token wird die Anfrage abgelehnt. Der Token wurde als Konstante im Code hinterlegt.

---

### 7. Gerätezuordnung über MAC-Adresse

Jeder Sensorcontroller identifiziert sich automatisch mit seiner eindeutigen MAC-Adresse als `device_id`. Das externe Team verknüpft diese MAC-Adresse in ihrer Datenbank mit einem Kindprofil. Neue Geräte müssen daher zuerst beim externen Team registriert werden, bevor Sessions gespeichert werden können.

---

## Anleitung zur Reproduzierbarkeit

### Benötigte Hardware

| Komponente | Anzahl | Verwendung |
|---|---|---|
| ESP32-C6 Dev Board | 2 | Basecontroller + Sensorcontroller |
| ICM-20948 Breakout Board | 1 | Lagesensor am Sensorcontroller |
| NeoPixel WS2812B Ring (12 LEDs) | 1 | LED-Anzeige am Basecontroller |
| TPS63020 Buck-Boost Modul | 1 | Spannungsregelung für Batteriebetrieb |
| LiFePO4 Akku (z.B. 26650) | 1 | Stromversorgung Sensorcontroller |
| Breadboard (2×) | 2 | Aufbau beider Controller |
| Jumper-Kabel | ~20 | Verbindungen |
| Widerstand 330 Ohm | 1 | Datenkabel des NeoPixel-Rings |
| USB-C Kabel | 2 | Programmieren und Betrieb Basecontroller |

---

### Benötigte Software

- **Arduino IDE** (Version 2.x empfohlen)
- **ESP32 Board Package** von Espressif (Version 3.x) – in Arduino IDE unter `Werkzeuge → Board → Boards Manager` suchen nach `esp32`
- **Libraries** (über `Sketch → Bibliothek einbinden → Bibliotheken verwalten`):
  - `Adafruit NeoPixel`
  - `SparkFun 9DoF IMU Breakout - ICM 20948`

---

### Verkabelung

**Sensorcontroller (ESP32-C6 + ICM-20948):**

| ICM-20948 | ESP32-C6 |
|---|---|
| VCC | 3.3V |
| GND | GND |
| SCL | GPIO 7 |
| SDA | GPIO 6 |
| NCS | 3.3V (I2C-Modus aktivieren) |
| ADO | GND (I2C-Adresse 0x68) |

**Stromversorgung Sensorcontroller:**

| TPS63020 | Verbindung |
|---|---|
| VIN | Batterie + |
| GND | Batterie – |
| OUT | ESP32-C6 3V3 |
| GND | ESP32-C6 GND |

**Basecontroller (ESP32-C6 + NeoPixel):**

| NeoPixel | ESP32-C6 |
|---|---|
| VCC | 5V (USB) |
| GND | GND |
| DIN | GPIO 8 → 330Ω → DIN |

---

### Vorgehensweise beim Nachbau

**Schritt 1 – Externe Infrastruktur klären**

Vor dem Aufbau der Hardware folgendes mit dem externen Team abstimmen:
- API-Endpoint URL und Token
- MAC-Adresse des Sensorcontrollers nach Erstem Start auslesen und Gerät registrieren lassen
- Erwartetes JSON-Format bestätigen: `device_id`, `timestamp`, `duration`

---

**Schritt 2 – Basecontroller aufbauen und programmieren**

1. NeoPixel Ring über 330Ω Widerstand mit GPIO 8 verbinden, VCC an 5V, GND an GND
2. [Basecontroller.ino](Basecontroller/Basecontroller.ino) öffnen und folgende Werte eintragen:
   - `AP_SSID` / `AP_PASSWORD`: frei wählbar, min. 8 Zeichen Passwort
   - `wifiList`: Heimnetz und/oder Hotspot eintragen
   - `DB_ENDPOINT`: URL vom externen Team
   - `API_TOKEN`: Token vom externen Team
   - `LED_PIN`: GPIO-Pin des NeoPixel-Datenkabels
3. Board: `ESP32C6 Dev Module`, Upload Speed: `460800`
4. Hochladen – bei Fehler BOOT-Taste gedrückt halten und RESET drücken
5. Serial Monitor (115200 Baud) öffnen, prüfen ob `AP aktiv` und `HTTP Server bereit` erscheint

---

**Schritt 3 – Sensorcontroller aufbauen und programmieren**

1. ICM-20948 gemäss Verkabelungstabelle anschliessen (NCS → 3.3V und ADO → GND nicht vergessen)
2. [Sensorcontroller.ino](Sensorcontroller/Sensorcontroller.ino) öffnen und eintragen:
   - `AP_SSID` / `AP_PASSWORD`: identisch mit Basecontroller
   - `SDA_PIN` / `SCL_PIN`: je nach Verkabelung
3. Hochladen (ebenfalls mit BOOT-Trick falls nötig)
4. Serial Monitor prüfen: `IMU OK` und `verbunden` müssen erscheinen
5. Falls `IMU nicht gefunden`: I2C-Scanner Sketch hochladen zur Diagnose (Sensor sollte auf `0x68` antworten)

---

**Schritt 4 – Verbindung testen**

1. Basecontroller läuft (USB am Laptop)
2. Sensorcontroller läuft (USB oder Batterie)
3. Sensor bewegen → Serial Monitor des Basecontrollers zeigt `Session gestartet`
4. LED-Ring füllt sich grün
5. Nach 10 Sekunden Stillstand: Session wird unterbrochen und an Datenbank gesendet

---

**Schritt 5 – Datenbankanbindung prüfen**

Nach einer abgeschlossenen Session im Serial Monitor prüfen:
```
DB Upload: {"token":"...","device_id":"...","timestamp":"...","duration":...}
DB Response HTTP 200
```

HTTP 200 = Eintrag erfolgreich gespeichert.
HTTP 404 = MAC-Adresse noch nicht beim externen Team registriert.

---

**Schritt 6 – Batteriebetrieb**

1. TPS63020 Ausgangsspannung mit Multimeter messen (sollte 3.3V sein)
2. TPS63020 OUT → ESP32 3V3, TPS63020 GND → ESP32 GND
3. Batterie anschliessen, USB abstecken
4. ESP32 startet automatisch – kein Laptop mehr nötig

---

### Konfigurationsübersicht

Alle anpassbaren Werte befinden sich am Anfang der jeweiligen Datei im Abschnitt `Konfiguration`:

| Datei | Parameter | Beschreibung |
|---|---|---|
| Basecontroller.ino | `AP_SSID` / `AP_PASSWORD` | Name und Passwort des eigenen WLANs |
| Basecontroller.ino | `wifiList` | Heimnetz und Hotspot |
| Basecontroller.ino | `DB_ENDPOINT` | API-URL des externen Teams |
| Basecontroller.ino | `API_TOKEN` | Sicherheits-Token |
| Basecontroller.ino | `LED_PIN` | GPIO-Pin des LED-Rings |
| Basecontroller.ino | `GRACE_MS` | Stillstandszeit vor Reset (Standard: 10s) |
| Basecontroller.ino | `SESSION_MS` | Zieldauer einer Session (Standard: 120s) |
| Sensorcontroller.ino | `AP_SSID` / `AP_PASSWORD` | Muss identisch mit Basecontroller sein |
| Sensorcontroller.ino | `MOTION_THRESHOLD` | Empfindlichkeit des Sensors (Standard: 0.15g) |
| Sensorcontroller.ino | `CONSECUTIVE_NEEDED` | Anzahl nötiger Messungen für Bewegungserkennung |
| Sensorcontroller.ino | `SDA_PIN` / `SCL_PIN` | I2C-Pins des Sensors |

---

## User Flows Physical Computing
![User Flow](./documentation/img/User%20Flow.jpeg)
![User Flow Early Abort](./documentation/img/User%20Flow%20Early%20Abort.jpeg)

---

## Steckschema

![ESP32 Schaltschema](./documentation/img/ESP32%20Schaltplaene.jpg)