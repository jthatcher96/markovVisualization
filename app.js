var bot = new Bot()

var nodeOptions = {
    font: "30px ariel red"
}

$(function(){


    $( document ).keypress(function(event) {
        // event.preventDefault();
        if(event.which == 13){
            var statement = $( "#statement" ).val();
            var replyLength = $( "#replyLength" ).val();
            bot.addStatement(statement);
            var newData = bot.createGraphData();
            network.setData(newData);

            $( "#statement" ).val('');
            $( "#top" ).append("<tr><td class='statement'>" + statement + " </td></tr>")

            if (document.getElementById("generateReply").checked === true){
                var reply = bot.reply(replyLength);
                $( "#top" ).append("<tr><td class='reply'>" + reply + " </td></tr>")
            }
            event.preventDefault();
        }

      });
});


function Bot(){
    this.dictionary = []
    this.graphData = {nodes:[],edges:[]}
};

function Node(){
    this.firstString = ""
    this.lastString = ""
    this.isStarter = false
    this.count = 1
}

Bot.prototype.graphNodeIsPresent = function(graphNode){
    for (var i in this.graphData.nodes){
        if (this.graphData.nodes[i].label === graphNode.label){
            return true;
        }
    }
    return false;
}

Bot.prototype.graphEdgeIsPresent = function(graphEdge){
    for (var i in this.graphData.edges){
        if (this.graphData.edges[i].to === graphEdge.to && this.graphData.edges[i].from === graphEdge.from){
            return true;
        }
    }
    return false; 
}

Bot.prototype.createGraphNodes = function(){
    var graphNodeArray = [];
    var labelString = "";
    var id = 0;
    for (var i in this.dictionary){
        var graphNode = {}
        labelString = this.dictionary[i].firstString + " | " + this.dictionary[i].lastString
        id = graphNodeArray.length
        graphNode.id = id
        graphNode.label = labelString
        graphNode.physics = true
        // graphNode.options.nodeOptions;
        graphNodeArray.push(graphNode)
    }
    return graphNodeArray;
}

Bot.prototype.createGraphEdges = function(){
    var edgeArray = []
    console.log(this.dictionary)
    for (var parentIndex in this.dictionary){
        var graphEdge = {}
        var lastString = this.dictionary[parentIndex].lastString

        for (var childIndex in this.dictionary){
            var firstString = this.dictionary[childIndex].firstString

            if (lastString === firstString){
                graphEdge.from = parentIndex
                graphEdge.to = childIndex
                graphEdge.arrows = 'to'
            }
        }
        edgeArray.push(graphEdge)
    }
    return edgeArray
}

Bot.prototype.createGraphData = function(){
    var graphNodes = this.createGraphNodes();
    var graphEdges = this.createGraphEdges();

    var nodeData = new vis.DataSet(graphNodes);
    var edgeData = new vis.DataSet(graphEdges);
    var dataSet = {nodes: nodeData, edges: edgeData}
    // console.log(dataSet);
    return dataSet

}

Bot.prototype.textToArray = function(text){
    var cleanText = text.replaceAll(",","").replaceAll('"',"").replaceAll('  ', " ");
    var array = cleanText.split(" ");
    return array;
}

Bot.prototype.addStatement = function(text){
    var array = bot.textToArray(text);
    var isStarter = true

    while (array.length > 1){

        var newNode = new Node()

        newNode.firstString = array[0]
        newNode.lastString = array[1]
        newNode.isStarter = isStarter

        isStarter = (array[0].includes(".") || array[0].includes("?"))

        if (this.isPresent(array[0],array[1])){
            this.addCount(array[0],array[1])
        }else{
            this.dictionary.push(newNode);
        }
        array.shift();
    }
}

Bot.prototype.isPresent = function(firstString,lastString){
    for (var i in this.dictionary){
        if (this.dictionary[i].firstString === firstString && this.dictionary[i].lastString === lastString){
            return true;
        }
    }
    return false;
}

Bot.prototype.addCount = function(firstString,lastString){
    for (var i in this.dictionary){
        if (this.dictionary[i].firstString === firstString && this.dictionary[i].lastString === lastString){
            this.dictionary[i].count += 1
        }
    }
}



Bot.prototype.reply = function(replyLength){
    var starter = this.findStarter()
    var nodes = this.gatherNodes(starter,replyLength - 1);    
    var reply = this.nodeToString(nodes)

    // console.log(this.dictionary.length)

    return reply;
}

Bot.prototype.findStarter = function(){
    var starterArray = [];

    for (var i = 0; i < this.dictionary.length; i++){
        if (this.dictionary[i].isStarter === true){
            starterArray.push(this.dictionary[i])
        }
    }
    return this.selectNode(starterArray);
}



Bot.prototype.gatherNodes = function(starter,replyLength){
    var possibleNodes = [];
    var replyNodes = [starter];

    while (replyNodes.length < replyLength){
        // console.log(replyNodes[(replyNodes.length - 1)])
        possibleNodes = this.findPossbileNodes(replyNodes[(replyNodes.length - 1)])

        var selectedNode = this.selectNode(possibleNodes);
        replyNodes.push(selectedNode)
    }
    return replyNodes
}

Bot.prototype.findPossbileNodes = function(previousNode){
    var firstString = previousNode.lastString;
    var resultArray = []

    for (var i = 0; i < this.dictionary.length; i++){
        if (this.dictionary[i].firstString === firstString){
            resultArray.push(this.dictionary[i])
        }
    }
    return resultArray;
}

Bot.prototype.selectNode = function(nodeArray){
    var totalCount = 0
    var counter = 0

    for (var i = 0; i < nodeArray.length; i++){
        totalCount += nodeArray[i].count;
    }
    var randomValue = Math.random() * totalCount

    for (var i = 0; i < nodeArray.length; i++){
        counter += nodeArray[i].count;
        if (counter > randomValue){
            return nodeArray[i];
        }
    }

    return this.findStarter();
}

Bot.prototype.nodeToString = function(nodes){
    var replyString = nodes[0].firstString + " " + nodes[0].lastString;
    nodes.shift();

    for (var i = 0; i < nodes.length; i++){
        var word = nodes[i].lastString;
        replyString = replyString + " " + word;
    }
    return replyString;
}


Bot.prototype.findProbability = function(node){
    var totalCount = 0
    var probability = 1.0
    var nodeArray = this.findPossbileNodes(node);

    if (nodeArray.length === 0){
        return 1.0;
    }else{
        for (var i = 0; i < nodeArray.length; i++) {
            totalCount += nodeArray[i].count;
        }
        probability = node.count/totalCount;
    }

    return probability
}


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};