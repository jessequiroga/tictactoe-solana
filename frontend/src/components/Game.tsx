import React, { useState, useEffect, FC } from "react";
import { Board } from "./Board";
import { getJrpcClient } from "../utils/jrpcclient";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { createGameByPlayer, endGame } from "../utils/solana";
import * as anchor from "@project-serum/anchor";
import { Transaction } from "@solana/web3.js";

require("@solana/wallet-adapter-react-ui/styles.css");

const GAME_ID = -1;

export const Game: FC = () => {
  // const network = WalletAdapterNetwork.Devnet;
  // const wallets = [new PhantomWalletAdapter(network)];
  const endpoint = "http://localhost:8899";

  const [xIsNext, setXIsNext] = useState(true);
  const [history, setHistory] = useState([{ squares: Array(9).fill(null) }]);
  const [gameID, setGameID] = useState(GAME_ID);
  const [userPosition, setUserPosition] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [blockHeight, setBlockHeight] = useState(0);
  const [serverKey, setServerKey] = useState("0x");

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const anchorWallet = useAnchorWallet();

  const newGame = async () => {
    setHistory([{ squares: Array(9).fill(null) }]);
    setUserPosition(-1);

    if (!anchorWallet) return;
    let gameState = await createGameByPlayer(endpoint, anchorWallet as anchor.Wallet);
    if (!gameState) return;
    setBlockHeight(gameState.blockHeight);
    const transaction = new Transaction().add(gameState.tx);
    const signature = await sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, "processed");

    const api = getJrpcClient();
    const response = await api.request(
      "TicTacToe.newgame",
      gameState.boardKey,
      gameState.blockHeight,
      publicKey,
      "bot"
    );
    const res = JSON.parse(response);
    setGameID(res.game_id);
    setXIsNext(res.player);
    setServerKey(res.server_key);

    setLoading(false);
  };

  const checkBoard = (): string[] => {
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    const winner = calculateWinner(squares);
    if (winner) {
      return [];
    }
    return squares;
  };

  const updateBoard = (i: number, squares: string[]) => {
    squares[i] = xIsNext ? "O" : "X";
    setHistory(
      history.concat({
        squares: [...squares],
      })
    );
    setXIsNext(!xIsNext);
    setLoading(false);
  };

  const handleClick = async (i: number) => {
    if (loading) return;

    let squares: string[] = checkBoard();

    if (squares.length && squares[i]) return;

    updateBoard(i, squares);
    setUserPosition(i);
  };

  const executeBot = async () => {
    const api = getJrpcClient();
    let x = -1, y = -1;
    if (userPosition !== -1) {
      x = Math.floor(userPosition / 3);
      y = userPosition % 3;
    }
    const response = await api.request(
      "TicTacToe.play",
      gameID,
      x,
      y,
      "player0"
    );
    const res = JSON.parse(response);
    const action = parseInt(res.action);

    const squares = checkBoard();
    if (squares.length > 0) {
      updateBoard(action, squares);
    } else {
      const current = history[history.length - 1];
      const squares = current.squares.slice();
      if (!anchorWallet) return;
      const board = squares.map(
        cell => {
          if (cell === "O") return 1;
          else if (cell === "X") return -1;
          return 0;
        }
      )
      let tx = await endGame(blockHeight, board, endpoint, anchorWallet as anchor.Wallet, serverKey);
      if (!tx) return;
      const transaction = new Transaction().add(tx);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "processed");
    }
    if (res.winner) setLoading(true);
  };
  useEffect(() => {
    if (xIsNext) {
      return;
    }
    setLoading(true);
    executeBot();
  }, [xIsNext, gameID]);

  const current = history[history.length - 1];
  const winner = calculateWinner(current.squares);

  const status = winner
    ? winner === "D"
      ? "Draw"
      : "Winner is " + winner
    : "Next player is " + (xIsNext ? "X" : "O");

  const moves = history.map((step, move) => {
    const desc = move ? "Go to #" + move : "Welcome game!";
    return <li key={move}>{desc}</li>;
  });

  return (
    <div className={winner ? "game disabled" : "game"}>
      <div className="game-board">
        <Board
          onClick={(i: number) => handleClick(i)}
          squares={current.squares}
        ></Board>
      </div>
      <div className="game-info">
        <p>
          <button onClick={newGame}>Start New Game</button>
        </p>
        <div>{status}</div>
        <ul>{moves}</ul>
      </div>
    </div>
  );
};

const calculateWinner = (squares: string[]) => {
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
  if (isDraw) return "D";
  return null;
};
