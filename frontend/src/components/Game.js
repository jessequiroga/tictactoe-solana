import React, { useState, useEffect } from 'react';
import Board from './Board';
import {getJrpcClient} from '../utils/jrpcclient';

const GAME_ID = -1

export default function Game() {
  const [xIsNext, setXIsNext] = useState(true)
  const [history, setHistory] = useState([{ squares: Array(9).fill(null) }])
  const [gameID, setGameID] = useState(GAME_ID)
  const [userPosition, setUserPosition] = useState(null)
  const [loading, setLoading] = useState(true)

  const newGame = async () => {
    setHistory([{ squares: Array(9).fill(null) }]);
    setUserPosition(null);
    const api = getJrpcClient();
    const response = await api.request("TicTacToe.newgame", "board-key-" + gameID + 22, "player0", "")
    const res = JSON.parse(response)
    setGameID(res.game_id)
    setXIsNext(res.player)
    setLoading(false)
  }

  const checkBoard = () => {
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    const winner = calculateWinner(squares);
    if (winner) {
      return null;
    }
    return squares;
  }

  const updateBoard = (i, squares) => {
    squares[i] = xIsNext ? 'O' : 'X';
    setHistory(history.concat({
      squares: [...squares],
    }));
    setXIsNext(!xIsNext);
    setLoading(false);
  }

  const handleClick = async (i) => {
    if (loading) return;

    let squares = checkBoard();
 
    if (squares && squares[i]) return;

    updateBoard(i, squares);
    setUserPosition(i);
  };

  const executeBot = async () => {
    const api = getJrpcClient();
    let x = -1, y = -1;
    if (userPosition !== null) {
      x = Math.floor(userPosition / 3);
      y = userPosition % 3
    }
    const response = await api.request("TicTacToe.play", gameID, x, y, "player0")
    const res = JSON.parse(response)
    const action = parseInt(res.action)
    
    const squares = checkBoard();
    if (squares != null) {
      updateBoard(action, squares);
    }
    if (res.winner) setLoading(true)
  }
  useEffect(() => {
    if (xIsNext) {
      return;
    }
    setLoading(true);
    executeBot();
  }, [xIsNext, gameID])

  const current = history[history.length - 1];
  const winner = calculateWinner(current.squares);

  const status = winner
    ? winner === 'D'
      ? 'Draw'
      : 'Winner is ' + winner
    : 'Next player is ' + (xIsNext ? 'X' : 'O');

  const moves = history.map((step, move) => {
    const desc = move ? 'Go to #' + move : 'Welcome game!';
    return (
      <li key={move}>{desc}</li>
    );
  });

  return (
    <div className={winner ? 'game disabled' : 'game'}>
      <div className="game-board">
        <Board
          onClick={(i) => handleClick(i)}
          squares={current.squares}
        ></Board>
      </div>
      <div className="game-info">
        <p><button onClick={newGame}>Start New Game</button></p>
        <div>{status}</div>
        <ul>{moves}</ul>
      </div>
    </div>
  );
}
const calculateWinner = (squares) => {
  const winnerLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  let isDraw = true;
  for (let i = 0; i < winnerLines.length; i++) {
    const [a, b, c] = winnerLines[i];
    if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c]) {
      return squares[a];
    }
    if (!squares[a] || !squares[b] || !squares[c]) {
      isDraw = false;
    }
  }
  if (isDraw) return 'D';
  return null;
};
