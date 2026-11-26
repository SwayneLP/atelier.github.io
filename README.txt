ATELIER — IMPOSITION V2
Ouvrir index.html dans Chrome. Internet nécessaire pour PDF.js et PDF-lib (CDN). Les PDF sont traités localement.

MODIFIER LE SITE
index.html : structure, champs, formats papier (valeurs en mm).
style.css : couleurs, mise en page et aperçu continu.
js/plan.js : ordre des pages et cahiers.
js/export.js : géométrie, échelle, repères et génération PDF.
js/paper.js : synchronisation des dimensions.
js/preview.js : affichage continu, rendu différé des faces.
js/app.js : import, état partagé, événements et téléchargement.
Les scripts classiques sont chargés dans l'ordre indiqué dans index.html, sans serveur ni compilation.
