# ADRESS CLUB

Application privée des résidents ADRESS IMMOBILIER (PWA).

## Publier une nouvelle version

1. Modifier les fichiers.
2. Dans `sw.js`, changer `CACHE` (`acl-v88` → `acl-v89`…) : c'est ce qui fait télécharger la nouvelle version aux téléphones. Sans ce changement, les téléphones gardent l'ancienne version.
3. Dans `index.html`, mettre le même numéro après `styles.css?v=` et `motion.js?v=`.
