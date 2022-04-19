import pytest
from flaskr import create_app
import click
from jsonrpcclient import parse, request

@pytest.fixture()
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    
    yield app

@pytest.fixture()
def client(app):
    return app.test_client()

@pytest.fixture()
def runner(app):
    return app.test_cli_runner()

def test_bot(client, runner):
    runner.invoke(args="init-db")
    response = client.post("/api/tictactoe", json=request("TicTacToe.newgame", params={"board_key":"board1", "player_a":"player1", "player_b":""}))
    
    parsed = parse(response.json)
    assert "game_id" in parsed.result

    response = client.post("/api/tictactoe", json=request("TicTacToe.play", params={"game_id": 1, "x": 0, "y": 0, "player": "player1"}))
    
    parsed = parse(response.json)
    print(parsed)
    assert "state" in parsed.result
    