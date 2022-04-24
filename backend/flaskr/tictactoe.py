from flask import g
from flask_jsonrpc import JSONRPCBlueprint
from typing import Union, Optional
import json
import random

from flaskr.db import get_db
from flaskr.solana_client import update_board

from qbot.access import Engine

engine = Engine()
bp = JSONRPCBlueprint('tictactoe', __name__)

@bp.method('TicTacToe.newgame')
def new_game(board_key: str, block_height: int, player_a: str, player_b: str) -> str:
    player, board_account, escrow_account = update_board(block_height=block_height, user_wallet=player_a)
    if board_key != str(board_account):
        print(board_key, board_account)
        return json.dumps({ 'game_id': -1, 'player': True })
    print(player)
    if player:
        player_a, player_b = player_b, player_a
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        'INSERT INTO board (player_a, player_b, block_height, board_key, escrow_account)'
        ' VALUES (?, ?, ?, ?, ?);',
        (player_a, player_b, str(block_height), board_key, str(escrow_account))
    )
    game_id = cursor.lastrowid
    db.commit()
    result = { 'game_id': game_id, 'player': player }
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