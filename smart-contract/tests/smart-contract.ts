import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { SmartContract } from "../target/types/smart_contract";

describe("smart-contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SmartContract as Program<SmartContract>;
  const user = Keypair.generate();
  const server = Keypair.generate();
  const provider = anchor.getProvider();

  it("Is createGameByPlayer!", async () => {
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(user.publicKey, 1e9), "confirmed"
    )
    // Add your test here.
    const [boardState, boardStateNonce] = await anchor.web3.PublicKey.findProgramAddress([
      Buffer.from(anchor.utils.bytes.utf8.encode("board-state")), user.publicKey.toBuffer()
    ], program.programId)

    const [escrowAccount, escrowAccountNonce] = await anchor.web3.PublicKey.findProgramAddress([
      Buffer.from(anchor.utils.bytes.utf8.encode("escrow-account")), boardState.toBuffer()
    ], program.programId)

    const blockHeight = await program.provider.connection.getBlockHeight();
    const amount = 50000000;

    const tx = await program.rpc.createGameByPlayer(new anchor.BN(blockHeight), new anchor.BN(amount), {
      accounts: {
        user: user.publicKey,
        boardState: boardState,
        escrowAccount: escrowAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      }, signers:[user]
    });
    console.log("Your transaction signature", tx);

    const board = await program.account.boardState.fetch(boardState);
    console.log("Board State :: ", board);
    
    const orgBalance = await provider.connection.getBalance(user.publicKey);
    const balance = await provider.connection.getBalance(escrowAccount);
    console.log(`User balance : ${orgBalance}, Escrow balance : ${balance}`)
  });

  it("Is createGameByServer!", async () => {
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(server.publicKey, 1e9), "confirmed"
    )
    // Add your test here.
    const [boardState, boardStateNonce] = await anchor.web3.PublicKey.findProgramAddress([
      Buffer.from(anchor.utils.bytes.utf8.encode("board-state")), user.publicKey.toBuffer()
    ], program.programId)

    const [escrowAccount, escrowAccountNonce] = await anchor.web3.PublicKey.findProgramAddress([
      Buffer.from(anchor.utils.bytes.utf8.encode("escrow-account")), boardState.toBuffer()
    ], program.programId)

    const tx = await program.rpc.createGameByServer(true, {
      accounts: {
        user: server.publicKey,
        boardState: boardState,
        escrowAccount: escrowAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      }, signers:[server]
    });
    console.log("Your transaction signature", tx);

    const board = await program.account.boardState.fetch(boardState);
    console.log("Board State :: ", board);
    
    const orgBalance = await provider.connection.getBalance(server.publicKey);
    const balance = await provider.connection.getBalance(escrowAccount);
    console.log(`Server balance : ${orgBalance}, Escrow balance : ${balance}`)
  });

  it("Is endGame!", async () => {
    // Add your test here.
    const [boardState, boardStateNonce] = await anchor.web3.PublicKey.findProgramAddress([
      Buffer.from(anchor.utils.bytes.utf8.encode("board-state")), user.publicKey.toBuffer()
    ], program.programId)

    const [escrowAccount, escrowAccountNonce] = await anchor.web3.PublicKey.findProgramAddress([
      Buffer.from(anchor.utils.bytes.utf8.encode("escrow-account")), boardState.toBuffer()
    ], program.programId)

    const tx = await program.rpc.endGame([1, 1, 1, 0, 0, 0, 0, 0, 0], escrowAccountNonce, {
      accounts: {
        player1: user.publicKey,
        player2: server.publicKey,
        boardState: boardState,
        escrowAccount: escrowAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      }, signers:[]
    });
    console.log("Your transaction signature", tx);

    const board = await program.account.boardState.fetch(boardState);
    console.log("Board State :: ", board);
    
    const userBalance = await provider.connection.getBalance(user.publicKey);
    const srvBalance = await provider.connection.getBalance(server.publicKey);
    const balance = await provider.connection.getBalance(escrowAccount);
    console.log(`Server balance : ${userBalance}, ${srvBalance}, Escrow balance : ${balance}`)
  });
});
