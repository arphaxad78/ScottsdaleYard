/*
The `positions` array parameter passed to these functions contains the positions of all players
  Mr X position is at index 0, Player 1 at index 1, and so on
*/
module.exports = {
  CONSTS: {
    MAX_PLAYERS: 2,
    MAX_TURNS: 2,
    PLAYER_STARTING_POSITIONS: [13,26,29,34,50,53,91,94,103,112,117,123,138,141,155,174],
    MRX_STARTING_POSITIONS: [35,45,51,71,78,104,106,127,132,146,166,170,172]
  },


  // returns an array with the starting positions of Mr X and the players
  getStartingPositions: function() {
    const positions = [];

    // Mr. X
    let random = Math.floor((Math.random() * this.CONSTS.MRX_STARTING_POSITIONS.length) + 1);
    positions.push(this.CONSTS.MRX_STARTING_POSITIONS[random - 1]);
    
    // Players
    const startingPos = this.CONSTS.PLAYER_STARTING_POSITIONS;
    const len = startingPos.length - 1;
    let pos;
    for (let i=1; i<= this.CONSTS.MAX_PLAYERS; i++) {
      do {
        random = Math.floor(Math.random() * len);
        pos = startingPos[random];
      } 
      while (positions.indexOf(pos) >= 0);

      positions.push(pos);
    }

    return positions;
  },

  // move Mr. X and return his move
  moveMrX: function(positions, turn) {
    return {
      position: positions[0] + 1,
      move: 'bus',
      isVisible: false
    };
  },

  // returns a boolean indicating if a player can move from startPostion to endPosition
  isMoveValid: function(startPosition, endPosition) {
    return Math.abs(startPosition - endPosition) <= 2;
  },

  // returns a boolean indicating if Mr X was caught
  isMrXCaught: function(positions) {
    for (let i=1; i<=this.CONSTS.MAX_PLAYERS; i++) {
      if (positions[0] === positions[i]) {
        return true;
      }
    }
    return false;
  }
}