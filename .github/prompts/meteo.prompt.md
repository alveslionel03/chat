---
name: meteo
summary: Fournit la météo pour une localisation donnée

# Description
Ce prompt permet d'intégrer un outil supplémentaire au LLM pour fournir des prévisions météorologiques. L'objectif est de permettre au LLM de détecter les requêtes liées à la météo et de répondre en utilisant une API météo gratuite. 

# Instructions
1. **Détection des requêtes météo** : Le LLM doit identifier les requêtes utilisateur mentionnant des termes comme "météo", "temps", ou des expressions similaires.
2. **Appel à l'outil météo** : Lorsqu'une requête est détectée, le LLM doit formuler une réponse en appelant l'outil météo avec les paramètres nécessaires (localisation, date, etc.).
3. **Mise en forme des résultats** : Les données retournées par l'outil météo doivent être formatées par le LLM pour fournir une réponse claire et concise à l'utilisateur. 

# Exemple d'utilisation
- Utilisateur : "Quelle est la météo à Paris demain ?"
- LLM : Appel à l'outil météo avec les paramètres { localisation: "Paris", date: "demain" }.
- Réponse : "La météo à Paris demain prévoit un ciel ensoleillé avec une température moyenne de 22°C."

# Remarques
- L'outil météo doit être capable de gérer des requêtes pour des conditions météorologiques actuelles et futures.
- Assurez-vous que les réponses soient adaptées au contexte et faciles à comprendre pour l'utilisateur final.