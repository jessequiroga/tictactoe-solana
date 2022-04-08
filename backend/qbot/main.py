from agent import Agent
from tictactoe import TicTacToe

ROWS = 3

def play(agent: Agent):
    game = TicTacToe(rows=ROWS, render=True)
    while True:
        action = agent.qlearner.get_best_action(game.get_state())
        winner = game.play(*action)
        if winner:
            print("**** you lost *****")
            return
        if game.is_ended():
            print("**** draw ****")
            return
        x, y = input("input x and y: ").split()
        winner = game.play(int(x), int(y))
        if winner:
            print("**** you won ****")
            return
        if game.is_ended():
            print("**** draw ****")
            return

q_agent = Agent(rows=ROWS)
print("learning...")
q_agent.learn()
print("done")

while True:
    print("\nlet's play\n")
    play(q_agent)