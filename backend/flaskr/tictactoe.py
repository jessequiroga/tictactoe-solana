from flask import g
from flask_jsonrpc import JSONRPCBlueprint
from typing import Union, Optional
import json
import random

from flaskr.db import get_db
from flaskr.solana import update_board

from qbot.access import Engine

engine = Engine()
bp = JSONRPCBlueprint('tictactoe', __name__)

@bp.method('TicTacToe.newgame')
def new_game(board_key: str, player_a: Optional[str], player_b: Optional[str]) -> str:
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        'INSERT INTO board (player_a, player_b, board_key)'
        ' VALUES (?, ?, ?);',
        (player_a, player_b, board_key)
    )
    game_id = cursor.lastrowid
    db.commit()
    result = { 'game_id': game_id, 'player': bool(random.getrandbits(1)) }
    return json.dumps(result)

@bp.method('TicTacToe.removegame')
def remove_game(game_id: int):
    engine.remove(game_id)

@bp.method('TicTacToe.play')
def play(game_id: int, x: int, y: int, player: str) -> str:
    db = get_db()
    board = db.execute(
        'SELECT player_a, player_b FROM board'
        ' WHERE id = ?;', (game_id,)
    ).fetchall()[0]

    winner, state = engine.play(game_id, x, y)

    update_board(state) # solana update

    db.execute(
            'INSERT INTO track (board_id, board_state, player)'
            ' VALUES (?, ?, ?);',
            (game_id, state, player)
        )
    db.commit()

    result = { "winner": winner, "state": state, "action": 3 * x + y }
    if winner:
        return json.dumps(result)

    if not (len(board['player_a']) and len(board['player_b'])):
        winner, state, action = engine.next_action(game_id)
        db.execute(
            'INSERT INTO track (board_id, board_state, player)'
            ' VALUES (?, ?, ?);',
            (game_id, state, "Bot")
        )
        db.commit()

        result = { "winner": winner, "state": state, "action": action[0] * 3 + action[1] }
        if winner:
            return json.dumps(result)

    return json.dumps(result)