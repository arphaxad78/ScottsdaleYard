const Alexa = require('alexa-sdk');
const Speech = require('ssml-builder');
const Consts = require('../consts.js');
const Game = require('./gameLogic.js');

module.exports = {
  start: function(handler) {
    // set game mode
    handler.handler.state = Consts.GAME_STATES.GAME;

    // get starting positions
    // MrX is at index 0
    const positions = Game.getStartingPositions();

    const speech = new Speech();
    speech.say('OK, lets get started');
    speech.pause('1s');
    speech.say('Mister X is currently invisible');
    for (const i=1; i<=4; i++) {
      speech.pause('1s');
      speech.say(`Player ${i} starts at ${positions[i]}`);
    }
    speech.pause('1s');
    speech.say('Ready for turn 1?');    

    const speechOutput = speech.ssml(true);

    handler.attributes["positions"] = positions;
    handler.attributes["history"] = [{ position: positions[0] }];
    handler.attributes["turn"] = 1;
    handler.emit(':askWithCard', speechOutput, speechOutput, Consts.GAME_NAME, speechOutput);
  },

  startTurn: function(handler) {
    const turn = handler.attributes["turn"];
    handler.attributes["player"] = 1;

    const speech = new Speech();
    speech.say(`Starting turn ${turn}`);
    speech.pause('1s');
    
    this.doMisterXMove(handler, speech);
  },

  doMisterXMove: function(handler, inSpeech) {
    const positions = handler.attributes["positions"] || [],
          history = handler.attributes["history"] || [],
          turn = handler.attributes["turn"];

    // move Mr X
    const mrx = Game.moveMrX(positions, turn);

    // save position
    positions[0] = mrx.position;
    handler.attributes["positions"] = positions;
    // save history
    history.push({
      position: mrx.position,
      move: mrx.move
    });
    handler.attributes["history"] = history;

    const speech = inSpeech || new Speech();
    speech.say(`Mister X took the ${mrx.move}`);
    speech.pause('1s');
    if (mrx.isVisible) {
      speech.say(`Mister X is at ${mrx.position}`);
    }
    else {
      speech.say('Mister X is still invisible');
    }
    speech.pause('1s');

    this.startPlayerMove(handler, speech);
  },

  startPlayerMove: function(handler, inSpeech) {
    const player = handler.attributes["player"];

    const speech = inSpeech || new Speech();
    speech.say(`Player ${player}, it's your move`);
    speech.pause('1s');
    speech.say('Where do you go?');
    const speechOutput = speech.ssml(true);

    handler.emit(':askWithCard', speechOutput)    
  },

  playerMove: function (handler, type, position) {
    const player = handler.attributes["player"],
          turn = handler.attributes["turn"],
          positions = handler.attributes["positions"];

    // validate player move
    const currentPosition = positions[player];
    if (!Game.isMoveValid(currentPosition, position)) {
      // move is invalid
      const speech = new Speech();
      speech.say(`Player ${player}, you cannot move from ${currentPosition} to ${position}`);
      speech.pause('1s');
      this.startPlayerMove(handler, speech);
      return;
    }

    // record the move
    position[player] = position;
    handler.attributes["positions"] = positions;

    // check if player moved on top of Mister X
    if (Game.isMrXCaught(positions)) {
      // Mr X is done
      handler.emit('Congratulations! You caught Mr. X');
      return;
    }

    if (player < Consts.MAX_PLAYERS) {
      handler.attributes["player"] = player + 1;
      this.startPlayerMove(handler);
    }
    else if (turn < Consts.MAX_TURNS) {
      handler.attributes["turn"] = turn + 1;
      this.startTurn(handler);    
    }
    else {
      handler.emit('Game over, man! Game Over!');
    }
  }
}