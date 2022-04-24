import { FC } from "react";
import { Square } from "./Square";

interface BoardProps {
  squares: string[];
  onClick: (index: number) => {};
}

export const Board: FC<BoardProps> = (props) => {
  return (
    <div className="board">
      {props.squares.map((value, index) => (
        <Square
          key={index}
          value={value}
          onClick={() => {
            props.onClick(index);
          }}
        />
      ))}
    </div>
  );
};
