

const socket = io();
//variable player
var playerNumber = null;
var playerName = null;

//variable damier d3
const largeurF = document.documentElement.clientWidth;
const rayon = largeurF/(7+(13*2*1.33)+13);

//variable attribut créature
const maxPoint = 9;
const maxPointAttr = 5;

window.addEventListener('beforeunload', function (e) {
    playerLeaving();
  });
  window.addEventListener('load', function (e) {
   document.getElementById("pointLeft").innerHTML= "Vous avez dépensé 3/" + maxPoint + " points";
   document.getElementById("strength").max = maxPointAttr;
   document.getElementById("perception").max = maxPointAttr;
   document.getElementById("reproduction").max = maxPointAttr;
 });
function updateMsg(text){
   document.getElementById("msg").innerHTML = text;
}

function sumPoint(){
   return parseInt(document.getElementById("strength").value) + 
         parseInt(document.getElementById("perception").value) +
         parseInt(document.getElementById("reproduction").value);
}

function updateValue(elem){
   const elemValue = document.getElementById(elem.id +"Value");
   var sum = sumPoint()
   if(sum > maxPoint){
      elem.value = parseInt(elem.value) - (sum - maxPoint);
   }  
   elemValue.innerHTML = "(" + elem.value + "):"
   document.getElementById("pointLeft").innerHTML = "Vous avez dépensé " +sumPoint() + "/" + maxPoint + " points";
}

function updatePage(myName,playerList){
   printPlayerList(playerList);
   const buttonIn = document.getElementById("in") ;
   const buttonOut = document.getElementById("out");
   const bool = buttonOut.hidden;//Si le button quitter est caché c'est que le genre rentre dans la partie sinon c'est qu'il a quitte
   buttonIn.disabled = bool;
   buttonIn.hidden = bool;
   buttonOut.disabled = !bool;
   buttonOut.hidden = !bool;
   bool?document.getElementById("nameIn").style.display = 'none' //cache le champ de texte ou l'utilisateur peut saisir son pseudo
   :document.getElementById("nameIn").style.display = 'inline';//réaffiche le champ et comme on a modifier le style il faut remettre le style inline
   document.getElementById("myName").innerHTML = myName;
}

function showParameters(firstPlayer){
   console.log(firstPlayer);
   document.getElementById("parameters").style.display="block";
   if(firstPlayer){
      console.log("fait");
      document.getElementById("createGame").style.display="block";
      document.getElementById("warning").style.display="inline";}
}

function createGame(){
   socket.emit('parameters',{
      'pseudo' : playerName,
      'nbPlayersMax' : document.getElementById("nbPlayersMax").value,
      'nbTurns' : document.getElementById("nbTurns").value
   });
}

function createCreature(){
   const creatureName = document.getElementById("creatureName");
   if(creatureName.value != ""){
      if(sumPoint()==maxPoint){
         updateMsg("");
         socket.emit('createCreature',{
            'owner' : playerName,
            'creatureName' : creatureName.value,
            'strength' : parseInt(document.getElementById("strength").value),
            'perception' :parseInt(document.getElementById("perception").value),
            'reproduction' :parseInt(document.getElementById("reproduction").value)
         });
      }else updateMsg("Vous n'avez pas dépensé tout vos points")
   }else updateMsg("Nom de créature invalide")
}

function playerLeaving(){
   if (playerNumber != null){
      socket.emit('removePlayer',playerNumber);
      playerName = "";
      playerNumber = null;
      updatePage("",[]);
      document.getElementById('msgOut').innerHTML="";
      document.getElementById("parameters").style.display="none";
      document.getElementById("createGame").style.display="none";
      document.getElementById("tablierInfo").style.display="none";
      document.getElementById("warning").style.display="none";
      document.getElementById('tablier').innerHTML="";
      document.getElementById('score').innerHTML = "";
      document.getElementById('winner').innerHTML = "";
      console.log("Je quitte");
   }
}
function playerEnter(){
   let myName = document.getElementById("nameIn").value;
   if (myName == ""){
      updateMsg("Choissisait un nom valide");
   }else{
      updateMsg("");
      socket.emit('enter',myName);
   }
}

function printPlayerList(list){
   var ul = document.getElementById("playerList");
   console.log("test", list);
   list.length==0?ul.innerHTML=''
      :ul.innerHTML = 'Liste Joueurs :';
   list.forEach(player =>{
      var new_li = document.createElement("li");
      if(playerName == player){
         new_li.id = "me";
         new_li.textContent = player + " (vous)";
      }else{
         new_li.textContent = player;
      }
      ul.appendChild(new_li);
      });
};

function sendMessage(event){
   event.preventDefault(); 
   if(playerNumber!=null){
      const msg = document.getElementById("msgIn").value;
      if(msg)socket.emit('msg',{'msg':msg,'pseudo':playerName});
   }else{
      updateMsg("Il faut être connecté pour envoyer un message");
   }
}

function color(hex){
   switch(hex){
      case "mountain":
         return "gray";
      case "plain" :
         return "green";
      case "sea":
         return "blue";
      case "home":
         return "brown";
      default :
         return "white"; //indique une erreur
   }
}

function genereCrea(rayon, nbLignes, nbColonnes, board) {
   let distance =  rayon - (Math.sin(1 * Math.PI / 3) * rayon); // distance entre deux hexagones
   let hexagone = creePointsHexagone(rayon);
   let home;
   d3.select("#svgTablier").selectAll(".creature").remove();
   for (let ligne = 0; ligne < nbLignes; ligne++) {
       for (let colonne = 0; colonne < nbColonnes; colonne++) {
           let x = hexagone[0][0] + (rayon - distance) * (2 + ligne + 2 * colonne);
           let y = distance * 2 + hexagone[0][1] + (rayon - distance * 2) * (1 + 2 * ligne);
           var hex =  board[ligne*nbLignes+colonne];
           if(Number.isInteger(hex)){
            console.log("print :",hex)
            var svg = d3.select("#svgTablier");
            svg.append("circle")
            .attr("cx", x)
            .attr("cy", y + rayon )
            .attr("r", rayon / 3) 
            .attr("stroke", "black")
            .attr("fill", "white");
            svg.append("text")  // Ajout du texte
            .text(hex)
            .attr("x", x-rayon/4)
            .attr("y", y + rayon + rayon/4  )
            .attr("fill", "black");  
           }else{
            d3.select("#svgTablier")
                  .append("circle")
                  .attr("cx", x)
                  .attr("cy", y + rayon )
                  .attr("r", rayon / 3) // Rayon réduit pour les joueurs
                  .attr("fill", hex)
                  .attr("class", "creature")
                  .attr("id", "j" + (ligne * nbLignes + colonne))
                  .on("click", function(d) {
                     let numHexagone = parseInt(d3.select(this).attr('id').substring(1));
                     //if (playerNumber == jeton) {
                        console.log("clic sur", numHexagone);
                        var selectedValue = document.querySelector('input[name="power"]:checked').value;
                        socket.emit('power',{'playerNumber':playerNumber,'num':numHexagone,'power':selectedValue});
                        
                        //socket.emit('pion', {'position':numHexagone,'numJoueur':numJoueur});
                     //};
                  });
            }
       }
   }
}

function printScore(s){
   var ul = document.getElementById('score');
   ul.innerHTML = "";
   for (var c in s){
      var new_li = document.createElement("li");
      new_li.style.color = s[c].color;
      new_li.innerHTML = "Le joueur " + c + " a un total de " +  s[c].count +" créatures nommées "  +  s[c].creatureName;
      ul.appendChild(new_li);
   }
}


socket.on('enter',data =>{
   playerName = data.playerName;
   playerNumber = data.playerNumber;
   updatePage(playerName,data.playersNames);
   showParameters(data.firstPlayer);
   console.log("le serveur a confirmé mon entrée");
});

socket.on('otherPlayerIn', data =>{
   //console.log("playerName "  + data.playerName);
   if (!(playerNumber == null)){//regarde si le joueur est dans la partie1
      var ul = document.getElementById("playerList");
      var new_li = document.createElement("li");
      new_li.textContent = data.playerName;
      ul.appendChild(new_li);
      console.log("Est arrivée : ",data.playerName);
   }
});

socket.on('otherPlayerOut', data =>{
   if (playerNumber !=null){
      playerNumber = data.playersNames.indexOf(playerName)
      printPlayerList(data.playersNames);
      if((playerNumber == 0 )&& !(rayon))showParameters(true); //on calcule le rayon lorsqu'on affiche le plateau et la on veut plus avoir les paramétres d'afficher
      console.log("Quelqu'un a quitté mon nouveau numéro est ",playerNumber);
   }

});

socket.on('serverMsg',data =>{
   updateMsg(data.message);
});

socket.on('msg',msg=>{
   if(playerNumber!=null){
      const textarea = document.getElementById('msgOut')
      textarea.append(msg);
      textarea.scrollTop = textarea.scrollHeight;
   }
});   

socket.on('printBoard',data=>{
   if(playerNumber!=null){
      document.getElementById("parameters").style.display="none";
      document.getElementById("createGame").style.display="none";
      document.getElementById("tablierInfo").style.display='block';
      genereDamier(rayon,data.nbLignes,data.nbColonnes,data.board);
   }
});

socket.on('turn',data=>{
   if(playerNumber != null){
      genereCrea(rayon, data.nbLignes, data.nbColonnes, data.creaturesBoard);
      document.getElementById("turn").innerHTML = "Tour :" + data.turn;
      printScore(data.score);
   }
});

socket.on('end',data=>{
   if(playerNumber!=null){
      console.log("data gagnant",data);
      document.getElementById("tablierInfo").style.display="none";
      document.getElementById('tablier').innerHTML="";
      printScore(data.score);
      document.getElementById("score").style.float = "left";
      document.getElementById("score").style.clear = "left";
      document.getElementById("winner").innerHTML = "Le gagnant est : " + data.winner + " avec ses " + data.count + " " + data.creatureName;
   }
});
//fonction honteusement volée du cour d'ou les noms en français

function creePointsHexagone(rayon) {
   var points = new Array();
   for (var i = 0; i < 6; ++i) {
         var angle = i * Math.PI / 3;
         var x = Math.sin(angle) * rayon;
         var y = -Math.cos(angle) * rayon;
         points.push([Math.round(x*100)/100, Math.round(y*100)/100]);
   }
   return points;
}
function clicked (){
   let numHexagone = parseInt(d3.select(this).attr('id').substring(1));
   //if (playerNumber == jeton) {
      console.log("clic sur", numHexagone);
      var selectedValue = document.querySelector('input[name="power"]:checked').value;
      socket.emit('power',{'playerNumber':playerNumber,'num':numHexagone,'power':selectedValue});
}

function genereDamier(rayon, nbLignes, nbColonnes,board) {
   let distance =  rayon - (Math.sin(1 * Math.PI / 3) * rayon); // distance entre deux hexagones

   d3.select("#tablier").append("svg").attr("id","svgTablier").attr("width", nbColonnes*1.33*2*rayon).attr("height",nbLignes*2*rayon);
   let hexagone = creePointsHexagone(rayon);
   for (let ligne=0; ligne < nbLignes; ligne++) {
      for (let colonne=0; colonne < nbColonnes; colonne++) {
         let d = "", x, y;
         for (h in hexagone) {
            x = hexagone[h][0]+(rayon-distance)*(2+ligne+2*colonne);
            y = distance*2 + hexagone[h][1]+(rayon-distance*2)*(1+2*ligne);
            if (h == 0) d += "M"+x+","+y+" L";
            else        d +=     x+","+y+" ";
         }
         d += "Z";
         d3.select("#svgTablier")
            .append("path")
            .attr("d", d)
            .attr("stroke", "black")
            .attr("fill", color(board[ligne*nbLignes+colonne]))
            .attr("class", "hexagoneDamier")
            .attr("id", "h"+(ligne*nbLignes+colonne)) // car un id doit commencer par une lettre
            .on("click", function(d) {
               let numHexagone = parseInt(d3.select(this).attr('id').substring(1));
               //if (playerNumber == jeton) {
                  console.log("clic sur", numHexagone);
                  var selectedValue = document.querySelector('input[name="power"]:checked').value;
                  socket.emit('power',{'playerNumber':playerNumber,'num':numHexagone,'power':selectedValue});
                  
                  //socket.emit('pion', {'position':numHexagone,'numJoueur':numJoueur});
               //};
            });
      }
   }
}


socket.on('power',data=>{
   document.getElementById('powerInfo').innerHTML = "Pouvoir : (" + data + " charges restantes)"
});