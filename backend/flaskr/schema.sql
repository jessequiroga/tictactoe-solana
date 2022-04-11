DROP TABLE IF EXISTS board;
DROP TABLE IF EXISTS track;

CREATE TABLE board(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_a TEXT,
    player_b TEXT,
    board_key TEXT UNIQUE NOT NULL
);

CREATE TABLE track(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    board_state TEXT NOT NULL,
    player TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES board (id)
);