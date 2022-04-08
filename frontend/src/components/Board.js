import React from "react";
import Square from "./Square";

export default function Board(props) {
  return (
    <div className="board">
      {props.squares.map((value, index) => (
        <Square
          value={value}
          onClick={() => {
            props.onClick(index);
          }}
        />
      ))}
    </div>
  );
}
