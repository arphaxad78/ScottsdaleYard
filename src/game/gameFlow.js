const Alexa = require('alexa-sdk');
const Speech = require('ssml-builder');
const Consts = require('../consts.js');
const Game = require('./gameLogic.js');
const GameState = require('./gameState.js');

const TRANSPORTATION_STRINGS = ['taxi', 'bus', 'train', 'boat'];

module.exports = {
  start: function(handler) {
    // set game mode
    handler.handler.state = Consts.GAME_STATES.GAME;

    const state = new GameState();

    // get starting positions
    // MrX is at index 0
    state.positions = Game.getStartingPositions();

    const speech = new Speech();
    speech.say('OK, lets get started');
    speech.pause('1s');
    speech.say('Mister X is currently invisible');
    for (let i = 1; i < state.positions.length; i++) {
      speech.pause('1s');
      speech.say(`Player ${i} starts at ${state.positions[i]}`);
    }
    speech.pause('1s');
    speech.say('Ready for turn 1?');    

    const speechOutput = speech.ssml(true);

    // save starting history
    for (let i = 0; i < state.positions.length; i++) {
      state.addHistory(i, state.positions[i], -1);
    }
    // set turn
    state.turn = 1;

    state.save(handler);
    handler.emit(':askWithCard', speechOutput, speechOutput, Consts.GAME_NAME, speechOutput);
  },

  startTurn: function(handler) {
    handler.handler.state = Consts.GAME_STATES.TURN;

    const state = new GameState(handler);
    state.player = 1;

    const speech = new Speech();
    speech.say(`Starting turn ${state.turn}`);
    speech.pause('1s');
    
    state.save(handler);
    this.doMisterXMove(handler, speech);
  },

  doMisterXMove: function(handler, inSpeech) {
    const state = new GameState(handler);

    // move Mr X
    const mrx = Game.moveMrX(state.positions, state.turn);

    // save position
    state.positions[0] = mrx.position;
    // save history
    state.addHistory(0, mrx.position, mrx.transportation);

    const speech = inSpeech || new Speech();
    speech.say(`Mister X took the ${TRANSPORTATION_STRINGS[mrx.transportation]}`);
    speech.pause('1s');
    if (mrx.isVisible) {
      speech.say(`Mister X is at ${mrx.position}`);
    }
    else {
      speech.say('Mister X is still invisible');
    }
    speech.pause('1s');

    state.save(handler);
    this.startPlayerMove(handler, speech);
  },

  startPlayerMove: function(handler, inSpeech) {
    const state = new GameState(handler);

    const speech = inSpeech || new Speech();
    speech.say(`Player ${state.player}, it's your move.`);
    speech.pause('1s');
    speech.say('Where do you go?');
    const speechOutput = speech.ssml(true);

    handler.emit(':askWithCard', speechOutput)    
  },

  playerMove: function (handler, position, transportation) {
    const state = new GameState(handler);
    let localTransportation = transportation;

    // validate player move
    const currentPosition = state.positions[state.player];
    let isMoveValid = false;
    if (typeof transportation === 'undefined') {
      // loop through transportations, lowest to highest, and try to find a valid move
      const ts = [Game.CONSTS.TRANSPORTATION.TAXI, Game.CONSTS.TRANSPORTATION.BUS, Game.CONSTS.TRANSPORTATION.TRAIN];
      for (let i = 0; i < ts.length; i++) {
        localTransportation = ts[i];
        if (Game.isMoveValid(currentPosition, position, localTransportation)) {
          isMoveValid = true;
          break;
        }
      }
    }
    else {
      // specific transportation
      isMoveValid = Game.isMoveValid(currentPosition, position, localTransportation);
    }

    if (!isMoveValid) {
      // move is invalid
      const transportationString = (typeof transportation !== 'undefined') ? ` by ${TRANSPORTATION_STRINGS[transportation]}` : ''
      const speech = new Speech();
      speech.say(`Player ${state.player}, you cannot move from ${currentPosition} to ${position}${transportationString}`);
      speech.pause('1s');
      this.startPlayerMove(handler, speech);
      return;
    }

    // record the move
    state.positions[state.player] = position;

    // save history
    state.addHistory(state.player, position, localTransportation);

    // check if player moved on top of Mister X
    if (Game.isMrXCaught(state.positions)) {
      // Mr X is done
      handler.emit(':tell', 'Congratulations! You caught Mr. X');
      return;
    }

    if (state.player < Game.CONSTS.MAX_PLAYERS) {
      state.player++;
      state.save(handler);
      this.startPlayerMove(handler);
    }
    else if (turn < Game.CONSTS.MAX_TURNS) {
      state.turn++;
      state.save(handler);
      this.startTurn(handler);    
    }
    else {
      handler.emit(':tell', 'Game over, man! Game Over!');
    }
  }
}