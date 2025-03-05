Projet réalisé par Jean-Matthieu colibeau en monôme.

Le projet comprend : 
- l'utilisateur peut se connecter avec un pseudo unique
- l'utilisateur peut se déconnecter
- l'utilisateur peut discuter avec les autres joueurs de la partie
- l'utilisateur peut paramétrer la partie s'il est le premier à la rejoindre
- l'utilisateur peut créer une créature en lui donnant un nom.
  Il lui attribut 9 points réparti sur la force, la perception et la reproduction tous 3 noté de 1 à 5.
- dés que tous les joueurs dans la parties ont fabriqué une créature la simulation se lance.
- le terrain de jeu est affiché selon la taille de la fenêtre au lancement et est un damier de 13*13 hexagones
- chaque hexagone représente soit une montagne(50%) soit une mer(15%) soit une prairie (35%)
- à chaque tour de jeu le serveur calcule les emplacement des créatures et l'envoie au client qui les affiche:
	- Les créatures selon leur soif ou leur faim décide sur quelle case ils souhaitent aller (prairie,mer ou taniére)
	- chaque créature utilise un algorithme de parcours en largeur  pour rechercher leur case souhaité en fonction de la perception si il ne la trouve pas 
	  il recherche leur deuxiéme case souhaité et si il ne la trouve toujours pas il se déplace aléatoirement
	- Si les créatures sont de sexe différents et ont suffisament de ressources et sont dans leur taniéres il se reproduisent
	- chaque déplacement ou arrêt consomme des ressources
	- les créatures récupérent des ressources en fonction de la case ou il se situe
- au cours de la partie chaque joueurs a trois intervention possible : transformer en soit en prarie(faire fleurir..) soit en montagne (reveiller la terre...) soit en mer (innonder...) pour cela il clique sur le button radio souhaité et clique sur le hex qu'il veut transformer.
- quand le nombre de tour atteint le nombre de tour max définit, le joueur avec le plus de créature gagne

je vous invite à modifier les valeurs, elles sont toutes explicitées.