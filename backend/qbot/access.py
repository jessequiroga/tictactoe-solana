from collections import defaultdict
from qbot.agent import Agent
from qbot.tictactoe import TicTacToe

ROWS = 3

class Engine:
    def __init__(self):
        self.agent = Agent(rows=ROWS)
        self.agent.learn()
        self.games = defaultdict(lambda: TicTacToe(rows=ROWS))
    
    def play(self, game_id: str, x: int, y: int):
        game = self.games[game_id]
        if x < 0 or x >= ROWS or y < 0 or y >= ROWS:
            return game.is_ended(), game.get_state()
        winner = game.play(x, y)
        if winner:
            return winner, game.get_state()
        return game.is_ended(), game.get_state()

    def next_action(self, game_id):
        game = self.games[game_id]
        action = self.agent.qlearner.get_best_action(game.get_state(), game.get_valid_actions())
        winner = game.play(*action)
        if winner:
            return winner, game.get_state(), action
        return game.is_ended(), game.get_state(), action

    def remove(self, game_id):
        del self.games[game_id]
