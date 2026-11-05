# Dimacon Wand-Kalkulator

Bohr- und Sägeassistent für Wanddurchbrüche. Die App berechnet aus Öffnungsmaßen, Wandstärke und Material den Schnitt- und Bohrplan: Schnitte, Laufmeter, Kernbohrungen, Segmente, Gewichte und Zeitaufwand.

Die App ist eine offlinefähige PWA ohne Backend. Der gesamte Auftrag liegt in der URL. Dieselbe Rechenlogik steht über einen [MCP-Server](#mcp-server) auch KI-Assistenten zur Verfügung.

**Produktion:** <https://dimacon-ai-apps.netlify.app>

## Funktionen

- **Aufträge:** mehrere Positionen pro Auftrag, Summen für Laufmeter und Zeit
- **Eingaben:** Breite, Höhe, Wandstärke, Material, max. Stückgewicht, Blattdurchmesser, Einstechtiefe, Bohrdurchmesser
- **Ergebnis:** Schnittanzahl, Laufmeter, Schnittfläche, Bohrungen, Segmente, Gewichte, Überschnitt, Zeitschätzung, Hinweis auf beidseitigen Schnitt
- **Manuelle Korrektur:** horizontale und vertikale Schnitte lassen sich überschreiben, abhängige Werte werden neu berechnet
- **Vorschau:** SVG-Schnittbild mit Zoom, Verschieben und Pinch-Geste; einzelne Seiten lassen sich deaktivieren, z. B. wenn unten kein Schnitt nötig ist
- **Vorlagen:** Standardtür, breite Türöffnung, Fensteröffnung, Durchbruch Beton, großer Durchbruch
- **Export:** Auftrag als JSON kopieren oder herunterladen
- **Offline:** nach dem ersten Online-Besuch vollständig nutzbar und installierbar

## Schnellstart

Voraussetzung ist Node.js `^20.19` oder `>=22.12` (Anforderung von Vite 8).

```bash
npm install
npm run dev
```

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver mit HMR |
| `npm run build` | Typecheck und Produktions-Build nach `dist/` |
| `npm run preview` | Build lokal ausliefern |
| `npm run lint` | ESLint |
| `npm run mcp` | MCP-Server über stdio starten |

Der Service Worker läuft nur im Build. Offline-Verhalten daher mit `npm run build && npm run preview` prüfen.

## Technik

React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui auf Base UI, React Router 7, `vite-plugin-pwa`, `fflate` (URL-Kompression) und FastMCP.

```text
src/
├── lib/calculations/   Rechenlogik, ohne UI-Abhängigkeiten
├── lib/url-state.ts    Kodierung des Auftrags für die URL
├── lib/templates.ts    Vorlagen
├── hooks/              URL-Zustand, Berechnung, Mobile-Erkennung
├── pages/MainPage.tsx  Positionsliste und Editor
├── components/         Formular, Ergebnisse, Vorschau, Export, shadcn/ui
├── mcp/server.ts       MCP-Server
└── types/              Gemeinsame Typen und deutsche Labels
public/
├── planungs-export-schema.json   JSON-Schema des Export-Formats
├── überschnittstabelle.pdf       Referenztabelle, in der App nicht verlinkt
└── _redirects                    SPA-Fallback für Netlify
```

## Rechenmodell

Die Konstanten stehen in `src/lib/calculations/common.ts`.

### Rechteckige Öffnungen

| Größe | Regel |
| --- | --- |
| Blattvorschlag | kleinstes Standardblatt (350–1200 mm) mit Durchmesser ≥ 2 × Wandstärke + 120 mm; kleinere Eingaben werden darauf angehoben |
| Max. Schnitttiefe | (Blattdurchmesser − 160 mm) / 2 |
| Beidseitiger Schnitt | wenn Wandstärke > max. Schnitttiefe; Laufmeter verdoppeln sich |
| Gewicht | Volumen × Materialdichte |
| Segmentierung | wenn Gewicht > max. Stückgewicht (Standard 150 kg): Raster mit der geringsten zusätzlichen Schnittlänge |
| Schnittfläche | Länge aller aktiven Schnitte × Wandstärke |
| Überschnitt Variante A (`maximal`) | √(r² − h²) − √(r² − (d + h)²) |
| Überschnitt Variante B (`wandstaerke`) | √(2·r·d − d²) |
| Bohrungen je Schnittkante | ⌈Überschnitt / Bohrdurchmesser⌉ (Standard 200 mm); an Ecken teilen sich beide Kanten eine Bohrung, deaktivierte Seiten entfallen |
| Zeit | Schnittfläche × 12 min/m² + Schnitte × 7 min + Bohrungen × 15 min |

Dabei ist r der halbe Blattdurchmesser, h = 80 mm der Flanschabstand und d die Wandstärke, bei beidseitigem Schnitt die halbe Wandstärke. Der Überschnitt wird auf 10 mm gerundet.

**Beispiel:** Die Vorlage „Standardtür“ (1000 × 2100 mm, Mauerwerk 240 mm, Blatt 600 mm, Variante A) ergibt:

- beidseitiger Schnitt, da die max. Schnitttiefe nur 220 mm beträgt
- 907,2 kg Gesamtgewicht, aufgeteilt in 8 Segmente à 113,4 kg
- 5 horizontale und 3 vertikale Schnitte, zusammen 22,6 m Laufmeter und 2,71 m² Schnittfläche
- 12 Bohrungen und 269 min geschätzte Zeit

### Runde Öffnungen

| Durchmesser | Vorgehen |
| --- | --- |
| ≤ 500 mm | eine Kernbohrung |
| > 500 mm | ⌈π × Durchmesser / 400 mm⌉ Bohrungen mit 500-mm-Krone entlang des Umfangs |

Die Zeit beträgt 15 min pro Bohrung. Gewichte werden für runde Öffnungen nicht berechnet.

### Materialien

| ID | Material | Dichte (kg/m³) |
| --- | --- | --- |
| `beton` | Beton | 2400 |
| `stahlbeton` | Stahlbeton | 2500 |
| `mauerwerk` | Mauerwerk | 1800 |
| `kalksandstein` | Kalksandstein | 2000 |
| `ziegel` | Ziegel | 1600 |
| `naturstein` | Naturstein | 2600 |

## Zustand in der URL

Ein Auftrag wird nirgends gespeichert. Zum Teilen oder Sichern genügt die URL aus der Adresszeile.

| Parameter | Inhalt |
| --- | --- |
| `s` | Auftrag als kompaktes JSON, base64url-kodiert |
| `e` | geöffnete Position: Index oder `new` |

- **Kodierung:** `encodeState` wählt die kürzere Variante. Beginnt der Wert mit `.`, ist das JSON zusätzlich mit DEFLATE komprimiert. Ältere Links ohne Kompression bleiben lesbar.
- **Struktur:** Die Felder sind in `public/planungs-export-schema.json` beschrieben.
- **Gespeicherte Berechnungen:** Enthält eine Position bereits eine Berechnung, wird diese beim Laden übernommen und nicht neu gerechnet. Dadurch bleiben manuelle Korrekturen erhalten, geänderte Formeln wirken sich aber nicht auf bestehende Links aus.

## MCP-Server

`src/mcp/server.ts` stellt die Rechenlogik über stdio bereit. Die `.mcp.json` im Repo registriert ihn als `dimacon-planung`, zusammen mit den Entwicklungswerkzeugen `shadcn` und `chrome-devtools`. Der Server muss aus dem Repo-Stamm gestartet werden und benötigt zuvor ein `npm install`.

| Tool | Zweck |
| --- | --- |
| `calculate_rectangular_opening` | Schnitt- und Bohrplan für eine rechteckige Öffnung |
| `calculate_circular_opening` | Bohrplan für eine runde Öffnung |
| `recalculate_opening` | rechteckige Öffnung mit überschriebenen Schnitt- oder Bohrungszahlen neu berechnen |
| `suggest_blade_diameter` | Blattvorschlag für eine Wandstärke |
| `estimate_time` | Zeitschätzung aus Schnittfläche, Schnitten und Bohrungen |
| `list_materials` | Materialien mit Dichten |
| `list_templates` | Vorlagen |
| `export_url_json` | Positionen berechnen und als JSON, kodierten String und Link zur Produktions-App ausgeben |

## Deployment

Die App läuft als statische Seite auf Netlify. Das Repo enthält keine `netlify.toml`, die Build-Einstellungen liegen also außerhalb des Repos. Gebaut wird mit `npm run build`, ausgeliefert wird `dist/`. `public/_redirects` leitet alle Pfade auf `index.html` um.

## Bekannte Einschränkungen

- **Runde Öffnungen:** Der Editor legt nur rechteckige Öffnungen an. Runde Öffnungen entstehen nur über den MCP-Server oder einen vorhandenen Link.
- **„Link kopieren“ im Export-Dialog:** Der Button erzeugt einen Link mit `#…`, die App liest aber nur `?s=…`. Der Auftrag wird damit nicht geladen. Stattdessen die URL aus der Adresszeile verwenden.
- **Bohrungen bei Variante B:** Die Oberfläche zeigt fest „2 Bohrungen/Ecke“. Die tatsächliche Anzahl hängt vom Überschnitt und vom Bohrdurchmesser ab.
- **Export-Schema:** Die Beschreibung der Kodierung in `planungs-export-schema.json` erwähnt die DEFLATE-Variante noch nicht.
- **Qualitätssicherung:** Es gibt keine automatisierten Tests, und `npm run lint` meldet derzeit 8 Fehler und 1 Warnung.
