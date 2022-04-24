use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Burn, Mint, MintTo, Token, Transfer};

declare_id!("EvwRqqGwNSnnwv8p67TL1n4y1YgiYDdgNzh8ntvDQdkw");

pub const BOARD_STATE_SEED: &str = "board-state";
pub const ESCROW_ACCOUNT_SEED : &str = "escrow-account";
pub const VALID_ROW: [[i8; 3]; 8] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

pub fn check_winner(board: [i8; 9]) -> BoardStateCode {

    for i in 0..VALID_ROW.len() {
        let mut sum: i8 = 0;
        for j in 0..VALID_ROW[i].len() {
            sum += board[j];
        }
        if sum.abs() == 3 {
            if board[VALID_ROW[i][0] as usize] == 1 {
                return BoardStateCode::FirstPlayerWin;
            } else {
                return BoardStateCode::SecondPlayerWin;
            }
        }
    }

    let mut tsum: i8 = 0;
    for i in 0..board.len() {
        tsum += board[i].abs();
    }

    if tsum != 9 {
        return BoardStateCode::Invaild;
    }

    return BoardStateCode::Draw;
}

#[program]
pub mod smart_contract {
    use std::result;

    use super::*;

    pub fn create_game_by_player(ctx: Context<CreateGamePlayer>, block_height: u64, amount: u64) -> Result<()> {
        ctx.accounts.board_state.player1 = ctx.accounts.user.key();
        ctx.accounts.board_state.block_height = block_height;
        ctx.accounts.board_state.amount = amount;

        let tx = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.escrow_account.key(),
            amount,    
        );
        anchor_lang::solana_program::program::invoke(
            &tx,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
            ]   
        )?;
        Ok(())
    }

    pub fn create_game_by_server(ctx: Context<CreateGameServer>, is_player_first: bool) -> Result<()> {
        if is_player_first {
            ctx.accounts.board_state.player2 = ctx.accounts.user.key();
        } else {
            ctx.accounts.board_state.player2 = ctx.accounts.board_state.player1;
            ctx.accounts.board_state.player1 = ctx.accounts.user.key();
        }

        let tx = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.escrow_account.key(),
            ctx.accounts.board_state.amount,    
        );
        anchor_lang::solana_program::program::invoke(
            &tx,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
            ]   
        )?;
        
        Ok(())
    }

    pub fn end_game(ctx: Context<EndGame>, board: [i8; 9], escrow_account_nonce: u8) -> Result<()> {
        let result= check_winner(board);
        let board_state = &ctx.accounts.board_state;
        let board_state_key = &board_state.key();

        let escrow_account_seeds = [
            ESCROW_ACCOUNT_SEED.as_bytes(), 
            board_state_key.as_ref(), 
            &[escrow_account_nonce]
        ];
        
        match result {
            BoardStateCode::Invaild => {
                return Ok(())
            }
            BoardStateCode::FirstPlayerWin => {
                let player = &ctx.accounts.player1;
                let tx = anchor_lang::solana_program::system_instruction::transfer(
                    &ctx.accounts.escrow_account.key(),
                    &player.key(),
                    board_state.amount * 2,    
                );
                anchor_lang::solana_program::program::invoke_signed(
                    &tx,
                    &[
                        player.to_account_info(),
                        ctx.accounts.escrow_account.to_account_info(),
                    ],
                    &[&escrow_account_seeds]  
                )?;
            }
            BoardStateCode::SecondPlayerWin => {
                let player = &ctx.accounts.player2;
                let tx = anchor_lang::solana_program::system_instruction::transfer(
                    &ctx.accounts.escrow_account.key(),
                    &player.key(),
                    board_state.amount * 2,    
                );
                anchor_lang::solana_program::program::invoke(
                    &tx,
                    &[
                        player.to_account_info(),
                        ctx.accounts.escrow_account.to_account_info(),
                    ]   
                )?;
            }
            BoardStateCode::Draw => {
                let tx1 = anchor_lang::solana_program::system_instruction::transfer(
                    &ctx.accounts.escrow_account.key(),
                    &ctx.accounts.player1.key(),
                    board_state.amount,    
                );
                anchor_lang::solana_program::program::invoke(
                    &tx1,
                    &[
                        ctx.accounts.player1.to_account_info(),
                        ctx.accounts.escrow_account.to_account_info(),
                    ]   
                )?;

                let tx2 = anchor_lang::solana_program::system_instruction::transfer(
                    &ctx.accounts.escrow_account.key(),
                    &ctx.accounts.player2.key(),
                    board_state.amount,    
                );
                anchor_lang::solana_program::program::invoke(
                    &tx2,
                    &[
                        ctx.accounts.player2.to_account_info(),
                        ctx.accounts.escrow_account.to_account_info(),
                    ]   
                )?;
            }
        }
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(block_height:u64)]
pub struct CreateGamePlayer<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        seeds = [BOARD_STATE_SEED.as_bytes(), user.key().as_ref(), &block_height.to_le_bytes()],
        bump,
        payer = user,
        space = 8 + std::mem::size_of::<Pubkey>() * 2 + 4 + 9 + 8 + 1 + 8,
    )]
    pub board_state: Account<'info, BoardState>,
    /// CHECK: for the escrow purpose
    #[account(
        mut,
        seeds = [ESCROW_ACCOUNT_SEED.as_bytes(), board_state.key().as_ref()],
        bump,
    )]
    pub escrow_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateGameServer<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [BOARD_STATE_SEED.as_bytes(), board_state.player1.as_ref(), &board_state.block_height.to_le_bytes()],
        bump,
    )]
    pub board_state: Account<'info, BoardState>,
    /// CHECK: for the escrow purpose
    #[account(
        mut,
        seeds = [ESCROW_ACCOUNT_SEED.as_bytes(), board_state.key().as_ref()],
        bump,
    )]
    pub escrow_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EndGame<'info> {
    /// CHECK: for the escrow purpose
    #[account(mut, constraint = player1.key()==board_state.player1@ErrorCode::PlayerNotMatched)]
    pub player1: AccountInfo<'info>,
    /// CHECK: for the escrow purpose
    #[account(mut, constraint = player2.key()==board_state.player2@ErrorCode::PlayerNotMatched)]
    pub player2: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [BOARD_STATE_SEED.as_bytes(), board_state.player1.as_ref(), &board_state.block_height.to_le_bytes()],
        bump,
    )]
    pub board_state: Account<'info, BoardState>,
    /// CHECK: for the escrow purpose
    #[account(
        mut,
        seeds = [ESCROW_ACCOUNT_SEED.as_bytes(), board_state.key().as_ref()],
        bump,
    )]
    pub escrow_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(Default)]
pub struct BoardState {
    pub amount: u64,
    pub block_height: u64,
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub board: [i8; 9],
}

#[error_code]
pub enum ErrorCode {
    #[msg("Player key is not matched!")]
    PlayerNotMatched,
}

pub enum BoardStateCode {
    Draw,
    FirstPlayerWin,
    SecondPlayerWin,
    Invaild,
}