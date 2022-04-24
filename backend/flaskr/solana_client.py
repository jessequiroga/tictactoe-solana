import json
import asyncio
from pydoc import cli
from nacl.public import PrivateKey as NaclPrivateKey
from solana.rpc.async_api import AsyncClient
from anchorpy import Idl, Program, Context
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from spl.token.constants import TOKEN_PROGRAM_ID

ENDPOINT = "http://127.0.0.1:8899"

class SolanaClient:
    def __init__(self, endpoint):
        self.client = AsyncClient(endpoint)
        with open(".secret", "r") as file:
            secret = [int(x) for x in json.loads(file.read())]
            self.sender = Keypair(NaclPrivateKey(bytes(bytearray(secret[:32]))))
        with open("smart_contract.json", "r") as f:
            raw_idl = json.load(f)
        self.idl = Idl.from_json(raw_idl)
        self.program_id = self.idl.metadata.address

    async def new_game(self, block_height, user_wallet):
        print(block_height, block_height+1)
        player = False
        for _ in range(10):
            block = await self.client.get_block(block_height + 1)
            if "result" in block:
                player = (block["result"]["blockhash"].encode()[-2] % 2) == 0
                print("block hash: ", block["result"]["blockhash"].encode()[-2])
                break
            await asyncio.sleep(0.05)

        board_account, _ =  PublicKey.find_program_address([
            "board-state".encode("utf8"),
            bytes(PublicKey(user_wallet)),
            int(block_height).to_bytes(8, "little")
        ], PublicKey(self.program_id))
        escrow_account, _ =  PublicKey.find_program_address([
            "escrow-account".encode("utf8"),
            bytes(board_account)
        ], PublicKey(self.program_id))
        accounts = {
            "user": self.sender.public_key,
            "board_state": board_account,
            "escrow_account": escrow_account,
            "system_program": SYS_PROGRAM_ID,
            "token_program": TOKEN_PROGRAM_ID
        }
        async with Program(self.idl, self.program_id) as program:
            await program.rpc["create_game_by_server"](
                True,
                ctx=Context(accounts=accounts, signers=[self.sender])
            )
            await program.close()
        return player, board_account, escrow_account

client = SolanaClient(ENDPOINT)

def update_board(block_height, user_wallet):
    return asyncio.run(client.new_game(block_height, user_wallet))
