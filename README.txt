Projet réalisé par Jean-Matthieu Colibeau en monôme.  

Le projet comprend :  
- L'utilisateur peut se connecter avec un pseudo unique.  
- L'utilisateur peut se déconnecter.  
- L'utilisateur peut discuter avec les autres joueurs de la partie.  
- L'utilisateur peut paramétrer la partie s'il est le premier à la rejoindre.  
- L'utilisateur peut créer une créature en lui donnant un nom.  
  Il lui attribue 9 points répartis sur la force, la perception et la reproduction, toutes trois notées de 1 à 5.  
- Dès que tous les joueurs de la partie ont fabriqué une créature, la simulation se lance.  
- Le terrain de jeu est affiché selon la taille de la fenêtre au lancement et est un damier de 13 × 13 hexagones.  
- Chaque hexagone représente soit une montagne (50 %), soit une mer (15 %), soit une prairie (35 %).  
- À chaque tour de jeu, le serveur calcule les emplacements des créatures et les envoie au client, qui les affiche :  
  - Les créatures, selon leur soif ou leur faim, décident sur quelle case elles souhaitent aller (prairie, mer ou tanière).  
  - Chaque créature utilise un algorithme de parcours en largeur pour rechercher sa case souhaitée en fonction de sa perception. Si elle ne la trouve pas,  
    elle recherche sa deuxième case souhaitée, et si elle ne la trouve toujours pas, elle se déplace aléatoirement.  
  - Si des créatures de sexes différents ont suffisamment de ressources et sont dans leur tanière, elles se reproduisent.  
  - Chaque déplacement ou arrêt consomme des ressources.  
  - Les créatures récupèrent des ressources en fonction de la case où elles se situent.  
- Au cours de la partie, chaque joueur a trois interventions possibles : transformer une case en prairie (faire fleurir...), en montagne (réveiller la terre...)  
  ou en mer (inonder...). Pour cela, il clique sur le bouton radio souhaité, puis sur l'hexagone qu'il veut transformer.  
- Quand le nombre de tours atteint le nombre maximal défini, le joueur ayant le plus de créatures gagne.  

Je vous invite à modifier les valeurs, elles sont toutes explicitées.  
