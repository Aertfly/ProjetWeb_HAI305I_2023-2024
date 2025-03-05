const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server);
server.listen(8888, () => { console.log('Le serveur écoute sur le port 8888'); });

const baseLevel = 3;
const costMoving = { "hunger": 0.25, "thirst": 0.5 }
const costStoping = { "hunger": 0.25, "thirst": 0.5 }
const thirstGivenSea = 3;
const hungerGivenPlain = 2;
var creaturesInfo = {}; // sert à vérifier les différences entre créatures
var creatures = []; //ici on stocker toutes les creatures de la partie
const players = [];
const playersPower = [];
var nbPlayersMax = 1;
var nbTurns = 10;

//variable plateau de jeu
const nbLignes = 13;
const nbColonnes = nbLignes
var percentageSeas = 0.15;
var percentagePlains = 0.35;
var percentageRocks = 0.50
const board = []; for (i = 0; i < nbLignes * nbColonnes; i++)board.push(randomCase());
const possibleHome = [Math.floor(nbLignes / 2) * nbLignes, Math.floor(nbLignes / 2) * nbLignes + nbColonnes - 1,
Math.floor(nbColonnes / 2), (nbLignes - 1) * nbLignes + Math.floor(nbColonnes / 2)];
const possibleColor = ['red', 'pink', 'yellow', 'black']
console.log(possibleHome);

app.get('/', (request, response) => {
    response.sendFile('client.html', { root: __dirname });
});
app.get('/fichier/:nomFichier', function (request, response) {
    //console.log("renvoi de "+request.params.nomFichier);
    response.sendFile(request.params.nomFichier, { root: __dirname });
});

io.on('connection', (socket) => {
    socket.on('enter', name => {
        var nbPlayers = players.length;
        if (nbPlayers < nbPlayersMax) {
            //console.log("Name reçu : " + name);
            if (players.includes(name)) {
                socket.emit('serverMsg', { 'message': "Nom déja pris" });
            } else {
                players.push(name);
                playersPower.push(3);
                socket.emit('enter', {
                    'playerName': name,
                    'playerNumber': players.length - 1,
                    'playersNames': players,
                    'firstPlayer': players.length == 1
                });
                socket.broadcast.emit('otherPlayerIn', {
                    'playerName': name,
                });
                console.log("Est rentré : ", name);
            }
        }
        else {
            socket.emit('serverMsg', { 'message': "Partie compléte" });
        }
    });

    socket.on('removePlayer', playerNumber => {
        //console.log(playerNumber);
        console.log("A demandé de sortir : ", players[playerNumber]);
        console.log("Numéro : ", playerNumber);
        var playerRemoved = players.splice(playerNumber, 1)[0];
        playersPower.splice(playerNumber, 1);
        if (playerRemoved) {
            const temp = creaturesInfo[playerRemoved];
            if (temp) {
                possibleHome.push(temp.home);
                board[temp.home] = randomCase();
                possibleColor.push(creaturesInfo[playerRemoved].color);
                delete creaturesInfo[playerRemoved];
                for (i = creatures.length - 1; i >= 0; i--) {
                    if (creatures[i].owner == playerRemoved) creatures.splice(i, 1);
                }
            }
        }
        socket.broadcast.emit('otherPlayerOut', {
            'playersNames': players
        });
    });

    socket.on('msg', data => {
        if (players.includes(data.pseudo)) io.emit('msg', data.pseudo + ": " + data.msg + "\n");
    })

    socket.on('parameters', data => {
        console.log(data)
        if (players.indexOf(data.pseudo) == 0) {
            if (data.nbPlayersMax > 0) {
                data.nbPlayersMax > 4 ? nbPlayersMax = 4 : nbPlayersMax = data.nbPlayersMax;//on ne peut pas dépasser 4 joueurs sinon on ne peut plus avoir les taniéres au milieu de chaque bord du terrain
            }
            if (data.nbTurns > 0) nbTurns = data.nbTurns;
            io.emit('msg', "Les paramétres de la partie ont été modifié par " + data.pseudo +
                "\nnombre de joueurs max: " + nbPlayersMax +
                "\nnombre de tour: " + nbTurns + "\n");
        } else {
            socket.emit('serverMsg', { 'message': "Vous n'êtes pas le proprietaire" });
        }
    });

    socket.on('createCreature', data => {
        const msgServer = newCreature(data);
        if (!msgServer) {
            const home = selectRandomHome()
            board[home] = "home";
            creaturesInfo[data.owner] = { "name": data.creatureName, "strength": data.strength, "perception": data.perception, "reproduction": data.reproduction, "home": home, "color": possibleColor.splice(0, 1)[0] }
            creatures.push({ "owner": data.owner, "sexe": "male", "loc": home, "hunger": baseLevel, "thirst": baseLevel, "procreation": 0 });
            creatures.push({ "owner": data.owner, "sexe": "female", "loc": home, "hunger": baseLevel, "thirst": baseLevel, "procreation": 0 });
            socket.emit('msg', "Vous avez crée la créature : " + data.creatureName + "\n");
            var temp;
            var cpt = 0;
            for (i = 0; i < players.length; i++) {
                temp = creaturesInfo[players[i]];
                if (temp) cpt++
            }
            if (cpt == players.length) {
                console.log("La partie se lance");
                io.emit('printBoard', { 'board': board, 'nbLignes': nbLignes, "nbColonnes": nbColonnes });
                const creatureColors = {};
                for (let l = 0; l < players.length; l++) {
                    creatureColors[players[l]] = creaturesInfo[players[l]].color;
                };
                const boardCrea = [];
                for (let j = 0; j < nbLignes * nbColonnes; j++) {
                    boardCrea.push("transparent");
                }
                var otherCreaturesLoc = creatures.map(obj => obj.loc)
                var score = {};
                gameLoop(socket, 1, creatureColors, boardCrea, otherCreaturesLoc,score);
            };
        } else socket.emit('serverMsg', { 'message': msgServer })
    });

    socket.on('power', data => {
        let pow = data.power;
        let num = data.num;
        console.log("Demande pouvoir ", data)
        if ((playersPower[data.playerNumber] > 0)&&(board[num] != "home")){
            switch (pow) {
                case 'plain':
                    board[num] = 'plain';
                    playersPower[data.playerNumber] -= 1;
                    io.emit('printBoard', { 'board': board, 'nbLignes': nbLignes, "nbColonnes": nbColonnes });
                    break;
                case 'mountain':
                    board[num] = 'mountain';
                    playersPower[data.playerNumber] -= 1;
                    io.emit('printBoard', { 'board': board, 'nbLignes': nbLignes, "nbColonnes": nbColonnes });
                    break;
                case 'sea':
                    board[num] = 'sea'
                    playersPower[data.playerNumber] -= 1;
                    io.emit('printBoard', { 'board': board, 'nbLignes': nbLignes, "nbColonnes": nbColonnes });
                    break;
                default:
                    break;
            }
        }
        console.log(playersPower[data.playerNumber]);
        socket.emit('power', playersPower[data.playerNumber])
    });

});

function selectRandomHome() {
    const randomNumber = Math.floor(Math.random() * possibleHome.length);
    const temp = possibleHome[randomNumber];
    possibleHome.splice(randomNumber, 1);
    console.log(possibleHome);
    console.log(temp);
    return temp;
}

function newCreature(creature) {
    var otherCrea
    for (i = 0; i < players.length; i++) {
        otherCrea = creaturesInfo[players[i]]
        if (otherCrea) {
            if (creature.owner == players[i]) return "Vous avez déja crée une créature";
            const msgServer = sameCreature(creature, otherCrea);
            if (msgServer) return msgServer;
        }
    }
    return null;
}

function sameCreature(crea1, crea2) {
    if (crea1.creatureName == crea2.creatureName) return "Une créature d'un autre joueur posséde déja ce nom";
    if ((crea1.strength == crea2.strength)
        && (crea1.perception == crea2.perception)
        && (crea1.reproduction == crea2.reproduction)) return "Une créature d'un autre joueur posséde déja ces attributs";
    return null;
}

function randomCase() {
    const random = Math.random();
    if (random <= percentageSeas) return "sea"; //case eau
    else if (random <= percentagePlains + percentageSeas) return "plain";//case prairie
    else if (random <= percentageRocks + percentagePlains + percentageRocks) return "mountain";//case rocher
    else return "error"; //indique une erreur dans la distribution
}

function neighbors(current_hex, creature, otherCreaturesLoc) {//marche mais à améliorer si j'ai le temps
    const ligne = Math.floor(current_hex / 13);
    const colonne = current_hex % 13;
    const res = [];
    if (ligne != 0) {
        canPush(res, (ligne - 1) * nbLignes + colonne, creature, otherCreaturesLoc);
        if (colonne != nbColonnes - 1) canPush(res, (ligne - 1) * nbLignes + colonne + 1, creature, otherCreaturesLoc);
    }
    if (ligne != nbLignes - 1) {
        canPush(res, (ligne + 1) * nbLignes + colonne, creature, otherCreaturesLoc);
        if (colonne != 0) {
            canPush(res, (ligne + 1) * nbLignes + colonne - 1, creature, otherCreaturesLoc);
        }
    }
    if (colonne != 0) canPush(res, (ligne) * nbLignes + colonne - 1, creature, otherCreaturesLoc);
    if (colonne != nbColonnes - 1) canPush(res, (ligne) * nbLignes + colonne + 1, creature, otherCreaturesLoc);
    return res;
}

function canPush(res, hex, creature, otherCreaturesLoc) {
    for (var player of players) {
        if (creaturesInfo[player].home == hex) {
            res.push(hex);
            break;
        }
    }
    if (otherCreaturesLoc.includes(hex)) {
        if (getStrength(hex) < creature.strength) res.push(hex);
    }
    else {
        res.push(hex);
    }
}
function getStrength(hex) {
    for (let i = 0; i < creatures.length; i++) {
        if (creatures[i].loc == hex) {
            return creaturesInfo[creatures[i].owner].strength;
        }
    }
    return 0;
}

function getCrea(hex) {
    console.log(hex, creatures);
    for (let b = 0; b < creatures.length; b++) {
        if (creatures[b].loc == hex) {
            console.log(creatures[b]);
            return creatures[b];
        }
    }
    return null;
}


function search(board, start, wishedBiome, creature, otherCreaturesLoc) {//principe d'algorithme de parcours en largeur tirer du cours d'algo 2, ajout d'une profondeur max pour simuler la perception
    const queue = [{ 'node': start, 'depth': 0 }];
    const marked = [start];
    const perception = creature.perception;
    var parents = {};
    var wishedHex = -1;
    while (queue.length > 0) {
        var currentHexInfo = queue.shift();
        var currentHex = currentHexInfo.node;
        var currentDepth = currentHexInfo.depth;

        if ((wishedBiome == "home") && (currentHex == creature.home)) {
            wishedHex = currentHex;
            break;
        } else {
            if (wishedBiome == board[currentHex]) {
                wishedHex = currentHex;
                break;
            }
        }
        if (currentDepth < perception) {
            var neighborList = neighbors(currentHex, creature, otherCreaturesLoc);
            for (var neighbor of neighborList) {
                if (!marked.includes(neighbor)) {
                    queue.push({ 'node': neighbor, 'depth': currentDepth + 1 });
                    marked.push(neighbor)
                    parents[neighbor] = currentHex;
                }
            }
        }
    }
    if (wishedHex == -1) return wishedHex;
    return reconstructFirstNode(parents, start, wishedHex);
}
function reconstructFirstNode(parents, start, wishedHex) {
    var currentHex = wishedHex;
    if (start === wishedHex) {
        return start;
    }
    let previousHex;
    while (currentHex !== start) {
        previousHex = currentHex
        currentHex = parents[currentHex];
    }

    return previousHex;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function gameLoop(socket, turn, creatureColors, boardCrea, otherCreaturesLoc,score) {
    console.log("Nouvelle boucle", turn);
    if (turn <= nbTurns) {
        var creaturesInHome = [];
        console.log("Color + home", creatureColors);
        console.log("location other crea", otherCreaturesLoc);
        console.log("Player", players);
        for (let k = 0; k < players.length; k++) {
            await delay(2000);
            let count = 0;
            console.log("Tour de", players[k], k, "/", players.length);
            if(!players[k]) return;
            for (let u = creatures.length - 1; u >= 0; u--) {
                if (creatures[u].owner == players[k]) {
                    count ++;
                    console.log("AVANT", creatures[u]);
                    otherCreaturesLoc.splice(otherCreaturesLoc.indexOf(creatures[u].loc), 1);//enlever la créature de la lise des localisations, obtenant ainsi la liste des localisation des autres
                    boardCrea[creatures[u].loc] = "transparent"; //enleve l'affichage de la créature à son emplacement précedent
                    play(creatures[u], otherCreaturesLoc);
                    otherCreaturesLoc.push(creatures[u].loc);//update la liste avec la nouvelle position de la creature
                    var biomeLoc = board[creatures[u].loc];
                    if (biomeLoc == "home") {
                        if (creatures[u].loc = creaturesInfo[creatures[u].owner].home) {
                            creaturesInHome.push(creatures[u]);
                        }
                    }
                    else {
                        if (biomeLoc == "plain") creatures[u].hunger += hungerGivenPlain;
                        else if (biomeLoc == "sea") creatures[u].thirst += thirstGivenSea;
                        boardCrea[creatures[u].loc] = creatureColors[creatures[u].owner];
                    }
                    creatures[u].procreation += 1;
                    console.log("APRES", creatures[u]);
                    var home = creaturesInfo[creatures[u].owner].home;
                    if ((creatures[u].thirst <= 0) || (creatures[u].hunger <= 0)) {
                        boardCrea[creatures[u].loc] = "transparent";
                        otherCreaturesLoc.splice(otherCreaturesLoc.indexOf(creatures[u].loc), 1);
                        creatures.splice(u, 1)// la créature est morte
                    }
                }
            }
            let cpt = 0;
            for (let g = 0; g < creaturesInHome.length - 1; g += 2) {
                let creature1 = creaturesInHome[g];
                let creature2 = creaturesInHome[g + 1];
                if ((creature1.procreation >= 5) && (creature2.procreation >= 5) && (diffSexe(creature1, creature2))) {
                    creature1.thirst -= 3
                    creature2.thirst -= 3
                    creature1.hunger -= 3
                    creature2.hunger -= 3
                    creature1.procreation = 0;
                    creature2.procreation = 0;
                    reproduce(creature1.owner, otherCreaturesLoc);
                    cpt++
                }
            }
            boardCrea[home] = creaturesInHome.length + cpt;
            score[players[k]]={"count":count,"creatureName":creaturesInfo[players[k]].name,"color":creaturesInfo[players[k]].color};
            console.log("SCORE :",score)
            io.emit('turn', { 'creaturesBoard': boardCrea, 'turn': turn, 'nbColonnes': nbColonnes, 'nbLignes': nbLignes,'score':score});
            creaturesInHome = [];
        }
        gameLoop(socket, turn + 1, creatureColors, boardCrea, otherCreaturesLoc,score);
    }else{
        let t=score[players[0]].count;
        let winner = players[0];
        let cr = score[players[0]].creatureName;
        for(let o=1;o<players.length;o++){
            if(t < score[players[o]].count){
                t=score[players[o]].count;
                winner = players[o];
                cr = score[players[o]].creatureName;
            }
        }
        io.emit('end',{'winner':winner,'count':t,'score':score,'creatureName':cr});
    }
}

function diffSexe(c1, c2) {
    return (((c1.sexe == "male") && (c2.sexe == "female")) || ((c1.sexe = "female") && (c2.sexe = "male")))
}
function randomSexe() {
    var sexe = ["male", "female"]
    return sexe[Math.floor(Math.random() * 2)]
}

function reproduce(owner, otherCreaturesLoc) {
    let info = creaturesInfo[owner];
    for (let r = 0; r < info.reproduction; r++) {
        creatures.push({ "owner": owner, "sexe": randomSexe(), "loc": info.home, "hunger": baseLevel, "thirst": baseLevel, "procreation": 0 });
        otherCreaturesLoc.push(info.home);
    }
}


function move(crea, hex, otherCreaturesLoc) {
    console.log("mouv normal");
    console.log("Location", otherCreaturesLoc);
    console.log("Hex concerné", hex)
    if (otherCreaturesLoc.includes(hex)) {
        var crea2 = getCrea(hex);
        if (crea2){
            crea2.loc = moveRandom(crea2, crea2.loc, otherCreaturesLoc);
            crea2.thirst -= costMoving.thirst;
            crea2.hunger -= costMoving.hunger;
        }
        else {
            otherCreaturesLoc.splice(otherCreaturesLoc.indexOf(hex),1)//quelque fois des locations de créatures inconnu se place dans la liste
        }
    }
    crea.loc = hex;
}

function moveRandom(crea, loc, otherCreaturesLoc) {
    console.log("move random");
    console.log("crea", crea, "loc", loc, "other", otherCreaturesLoc);
    const li = neighbors(loc, crea, otherCreaturesLoc);
    if (li.length > 0) {
        const random = Math.floor(Math.random() * li.length);
        return li[random];
    }
    return loc;

}

function play(crea, otherCreaturesLoc) {//plus jamais faire autant de if
    var res;
    var baseLoc = crea.loc;
    if ((crea.thirst >= 6) && (crea.hunger >= 6)) {
        console.log("Recherche taniére")
        res = search(board, crea.loc, "home", creaturesInfo[crea.owner], otherCreaturesLoc)
        if (res != -1) crea.loc = res;
        else crea.loc = moveRandom(crea, crea.loc, otherCreaturesLoc);
    } else {
        if (crea.thirst > crea.hunger) {
            console.log("A faim");
            res = search(board, crea.loc, "plain", creaturesInfo[crea.owner], otherCreaturesLoc);
            if (res != -1) {
                move(crea, res, otherCreaturesLoc)
            } else {
                res = search(board, crea.loc, "sea", creaturesInfo[crea.owner], otherCreaturesLoc);
                if (res != -1) {
                    move(crea, res, otherCreaturesLoc)
                }
                else crea.loc = moveRandom(crea, crea.loc, otherCreaturesLoc);
            }
        } else {//l'eau ayant une valeur plus grande, la créature priviligie l'eau en cas d'égalité eau/faim
            console.log("A soif");
            res = search(board, crea.loc, "sea", creaturesInfo[crea.owner], otherCreaturesLoc);
            if (res != -1) {
                move(crea, res, otherCreaturesLoc)
            } else {
                res = search(board, crea.loc, "plain", creaturesInfo[crea.owner], otherCreaturesLoc);
                if (res != -1) {
                    move(crea, res, otherCreaturesLoc)
                }
                else crea.loc = moveRandom(crea, crea.loc, otherCreaturesLoc);
            }
        }
    }
    if (crea.loc != baseLoc) {
        crea.thirst -= costMoving.thirst;
        crea.hunger -= costMoving.hunger;
    } else {
        crea.thirst -= costStoping.thirst;
        crea.hunger -= costStoping.hunger;
    }
}


