import React, { useState } from 'react';
import Board from './Board';
import {getJrpcClient} from '../utils/jrpcclient';

export default function Game() {
  const [xIsNext, setXIsNext] = useState(true)
  const [history, setHistory] = useState([{ squares: Array(9).fill(null) }])
  
  const newGame = async () => {
    setHistory([{ squares: Array(9).fill(null) }]);
    setXIsNext(true);
    const api = getJrpcClient();
    const response = await api.request("TicTacToe.newgame", "board-key-0", "player0", "")
    console.log(response);
  }

  const handleClick = async (i) => {
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    const winner = calculateWinner(squares);
    if (winner || squares[i]) {
      return;
    }
    squares[i] = xIsNext ? 'X' : 'O';
    setHistory(history.concat({
      squares: squares,
    }));
    setXIsNext(!xIsNext);
  };
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
