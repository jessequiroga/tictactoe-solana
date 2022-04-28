import json
import random
import asyncio
import time
from nacl.public import PrivateKey as NaclPrivateKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.api import Client
from anchorpy import Idl, Program, Context
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from spl.token.constants import TOKEN_PROGRAM_ID

ENDPOINT = "http://127.0.0.1:8899"

with open(".secret", "r") as file:
    secret = [int(x) for x in json.loads(file.read())]
    sender = Keypair(NaclPrivateKey(bytes(bytearray(secret[:32]))))
with open("smart_contract.json", "r") as f:
    raw_idl = json.load(f)
idl = Idl.from_json(raw_idl)
program_id = idl.metadata.address

async def new_game(block_height, user_wallet):
    player = False    
    async with AsyncClient(ENDPOINT) as client:
        for _ in range(10):
            block = await client.get_block(block_height + 1)
            if "result" in block:
                player = (block["result"]["blockhash"].encode()[-2] % 2) == 0
                print("block hash: ", block["result"]["blockhash"].encode()[-2])
                break
            time.sleep(0.05)
        if not player:
            player = bool(random.getrandbits(1))
    print("Is First: ", player)
    board_account, _ =  PublicKey.find_program_address([
        "board-state".encode("utf8"),
        bytes(PublicKey(user_wallet)),
        int(block_height).to_bytes(8, "little")
    ], PublicKey(program_id))
    escrow_account, _ =  PublicKey.find_program_address([
        "escrow-account".encode("utf8"),
        bytes(board_account)
    ], PublicKey(program_id))
    accounts = {
        "user": sender.public_key,
        "board_state": board_account,
        "escrow_account": escrow_account,
        "system_program": SYS_PROGRAM_ID,
        "token_program": TOKEN_PROGRAM_ID
    }
    async with Program(idl, program_id) as program:
        await program.rpc["create_game_by_server"](
            player,
            ctx=Context(accounts=accounts, signers=[sender])
        )
        await program.close()
    return player, board_account, escrow_account


def update_board(block_height, user_wallet):    
    return asyncio.run(new_game(block_height, user_wallet))
