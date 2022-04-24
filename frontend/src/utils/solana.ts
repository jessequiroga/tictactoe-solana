import {
  Connection,
  Commitment,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import idl from "./smart_contract.json";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";

interface optsType {
  preflightCommitment: Commitment;
}
const opts: optsType = {
  preflightCommitment: "processed",
};

async function getProvider(endpoint: string, wallet: anchor.Wallet) {
  const connection = new Connection(endpoint, opts.preflightCommitment);

  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );

  return provider;
}

export async function createGameByPlayer(
  endpoint: string,
  wallet: anchor.Wallet
) {
  const provider = await getProvider(endpoint, wallet);
  const program = new anchor.Program(
    idl as anchor.Idl,
    idl.metadata.address,
    provider
  );

  const blockHeight = await program.provider.connection.getBlockHeight();
  const amount = 50000000;
  try {
    const [boardState] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("board-state")),
        wallet.publicKey.toBuffer(),
        (new anchor.BN(blockHeight)).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    const [escrowAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("escrow-account")),
        boardState.toBuffer(),
      ],
      program.programId
    );
    return {
      tx: program.instruction.createGameByPlayer(
        new anchor.BN(blockHeight),
        new anchor.BN(amount),
        {
          accounts: {
            user: wallet.publicKey,
            boardState: boardState,
            escrowAccount: escrowAccount,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      ), 
      blockHeight: blockHeight,
      boardKey: boardState,
    }
  } catch (err) {
    console.log("Transaction error:", err);
  }
}

export async function endGame(
  blockHeight: number,
  board: number[],
  endpoint: string,
  wallet: anchor.Wallet,
  serverPublicKey: string
) {
  const provider = await getProvider(endpoint, wallet);
  const program = new anchor.Program(
    idl as anchor.Idl,
    idl.metadata.address,
    provider
  );
  try {
    const [boardState] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("board-state")),
        wallet.publicKey.toBuffer(),
        (new anchor.BN(blockHeight)).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    const [escrowAccount, escrowAccountNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("escrow-account")),
          boardState.toBuffer(),
        ],
        program.programId
      );
    return program.instruction.endGame(
      board,
      escrowAccountNonce,
      {
        accounts: {
          player1: wallet.publicKey,
          player2: new anchor.web3.PublicKey(serverPublicKey),
          boardState: boardState,
          escrowAccount: escrowAccount,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [],
      }
    );
  } catch (err) {
    console.log("Transaction error:", err);
  }
}
