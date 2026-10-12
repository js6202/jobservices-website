/* Job Services – Konfiguration
   Nach dem Einrichten des Google Apps Scripts hier die Web-App-URL der
   ÖFFENTLICHEN Bereitstellung eintragen (endet auf /exec).
   Solange apiUrl leer ist, läuft die Website im Vorschau-Modus mit Beispielstellen
   und es wird nichts versendet. */
window.JOBSERVICES_CONFIG = {
  apiUrl: "",
  lang: document.documentElement.lang || "de",
  maxFileMB: 5,
  maxTotalMB: 15,
  allowedExt: ["pdf", "doc", "docx", "jpg", "jpeg", "png", "heic"]
};
