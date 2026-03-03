# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Die Kistegucker e.V." [ref=e4] [cursor=pointer]:
        - /url: /
      - navigation [ref=e5]:
        - link "Start" [ref=e6] [cursor=pointer]:
          - /url: /
        - link "Theaterstücke" [ref=e7] [cursor=pointer]:
          - /url: /events
        - link "Mitglieder" [ref=e8] [cursor=pointer]:
          - /url: /mitglieder
        - link "Admin" [active] [ref=e9] [cursor=pointer]:
          - /url: /admin
  - main [ref=e10]:
    - generic [ref=e11]:
      - heading "Adminbereich" [level=1] [ref=e12]
      - paragraph [ref=e13]: Bereich zur Verwaltung von Mitgliedern, Aufführungen und Reservierungen.
      - generic [ref=e14]:
        - heading "Admin Login" [level=2] [ref=e15]
        - textbox "E-Mail-Adresse" [ref=e16]
        - textbox "Passwort" [ref=e17]
        - button "Einloggen" [ref=e18] [cursor=pointer]
  - contentinfo [ref=e19]:
    - generic [ref=e20]:
      - paragraph [ref=e21]: © 2026 Die Kistegucker e.V. · Linsengericht
      - generic [ref=e22]:
        - link "Impressum" [ref=e23] [cursor=pointer]:
          - /url: /impressum
        - link "Datenschutz" [ref=e24] [cursor=pointer]:
          - /url: /datenschutz
  - generic [ref=e25]:
    - paragraph [ref=e26]: Wir verwenden ausschließlich technisch notwendige Cookies. Tracking- oder Marketing-Cookies setzen wir derzeit nicht ein.
    - button "Verstanden" [ref=e27] [cursor=pointer]
  - alert [ref=e28]
```