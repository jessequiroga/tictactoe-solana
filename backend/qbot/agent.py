import random
from xmlrpc.client import Boolean

from qbot.tictactoe import TicTacToe
from qbot.q import Q

class Agent:
    def __init__(self, rows=3):
        self.eps = 1.0
        self.qlearner = Q()
        self.rows = rows

    def _get_action(self, state, valid_actions):
        if random.random() < self.eps:
            return random.choice(valid_actions)
        best = self.qlearner.get_best_action(state, valid_actions)
        return best

    def _learn_one_game(self, flag: Boolean):
        game = TicTacToe(self.rows)
        if flag:
            game.play(*random.choice(game.get_valid_actions()))
        while True:
            state = game.get_state()
            action = self._get_action(state, game.get_valid_actions())
            winner = game.play(*action)

            if winner or game.is_ended():
                self.qlearner.update(state, action, game.get_state(),  100 if winner else 10)
                break
            
            winner = game.play(*random.choice(game.get_valid_actions()))
            if winner or game.is_ended():
                self.qlearner.update(state, action, game.get_state(), -100 if winner else 10)
                break
            self.qlearner.update(state, action, game.get_state(), 0)

    def learn(self, n=300000):
        delta = 2.0 / n
        for i in range(n):
            self._learn_one_game(i % 2 == 0)
            self.eps -= delta
