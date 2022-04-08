class TicTacToe:
    def __init__(self, rows = 3, render=False):
        self.board = [[0] * rows for _ in range(rows)]
        self.player = 1
        self.repr = {0: ".", 1: "x", -1: "o"}
        self.rows = rows
        self.render = render
    
    def _get_winner(self):
        # check horizontal
        for i in range(self.rows):
            if abs(sum(self.board[i])) == self.rows:
                return self.board[i][0]

        # check vertical
        for i in range(self.rows):
            if abs(sum(self.board[j][i] for j in range(self.rows))) == self.rows:
                return self.board[0][i]
        
        # check diagonal
        if abs(sum(self.board[i][i] for i in range(self.rows))) == self.rows:
            return self.board[0][0]
        if abs(sum(self.board[i][self.rows - i - 1] for i in range(self.rows))) == self.rows:
            return self.board[0][self.rows - 1]

        return None

    def get_state(self):
        return str(self.board)

    def get_valid_actions(self):
        actions = []
        for i in range(self.rows):
            for j in range(self.rows):
                if self.board[i][j] == 0:
                    actions.append((i, j))
        return actions

    def is_ended(self):
        for i in range(self.rows):
            for j in range(self.rows):
                if self.board[i][j] == 0:
                    return False
        return True

    def _print(self):
        for row in self.board:
            for item in row:
                print(self.repr[item], end="\t")
            print("\n")
        print("---------------\n")
    
    def play(self, x, y):
        if self.board[x][y] != 0:
            return None
        
        self.board[x][y] = self.player
        if self.render:
            self._print()
        winner = self._get_winner()
        if winner:
            return winner
        self.player *= -1
        return None