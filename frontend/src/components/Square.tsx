import { FC } from "react";

interface SquareProps {
  value: string;
  onClick: () => void;
}

export const Square: FC<SquareProps> = (props) => {
  return (
    <button
      className={props.value ? "btn disabled" : "btn"}
      onClick={props.onClick}
    >
      {props.value}
    </button>
  );
};
