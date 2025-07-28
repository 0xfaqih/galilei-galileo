import { BaseDex } from './baseDex.js';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { signer } from '../../config/index.js';
import { CONFIG } from '../../config/index.js';

export class Zer0Dex extends BaseDex {
  constructor() {
    super('Zer0');
  }

  getSwapContract() {
    return '0xb95B5953FF8ee5D5d9818CdbEfE363ff2191318c';
  }

  getLiquidityContract() {
    return '0x44f24B66b3BAa3A784dBeee9bFE602f15A2Cc5d9';
  }

  getSwapAbi() {
    return [
      {
        "inputs": [
          {
            "components": [
              { "internalType": "address", "name": "tokenIn", "type": "address" },
              { "internalType": "address", "name": "tokenOut", "type": "address" },
              { "internalType": "uint24", "name": "fee", "type": "uint24" },
              { "internalType": "address", "name": "recipient", "type": "address" },
              { "internalType": "uint256", "name": "deadline", "type": "uint256" },
              { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
              { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
              { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
            ],
            "internalType": "struct ISwapRouter.ExactInputSingleParams",
            "name": "params",
            "type": "tuple"
          }
        ],
        "name": "exactInputSingle",
        "outputs": [
          { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
        ],
        "stateMutability": "payable",
        "type": "function"
      }
    ];
  }

  getLiquidityAbi() {
    return [
      {
        "inputs": [
          {
            "components": [
              { "internalType": "address", "name": "token0", "type": "address" },
              { "internalType": "address", "name": "token1", "type": "address" },
              { "internalType": "uint24", "name": "fee", "type": "uint24" },
              { "internalType": "int24", "name": "tickLower", "type": "int24" },
              { "internalType": "int24", "name": "tickUpper", "type": "int24" },
              { "internalType": "uint256", "name": "amount0Desired", "type": "uint256" },
              { "internalType": "uint256", "name": "amount1Desired", "type": "uint256" },
              { "internalType": "uint256", "name": "amount0Min", "type": "uint256" },
              { "internalType": "uint256", "name": "amount1Min", "type": "uint256" },
              { "internalType": "address", "name": "recipient", "type": "address" },
              { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ],
            "internalType": "struct INonfungiblePositionManager.MintParams",
            "name": "params",
            "type": "tuple"
          }
        ],
        "name": "mint",
        "outputs": [
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
          { "internalType": "uint128", "name": "liquidity", "type": "uint128" },
          { "internalType": "uint256", "name": "amount0", "type": "uint256" },
          { "internalType": "uint256", "name": "amount1", "type": "uint256" }
        ],
        "stateMutability": "payable",
        "type": "function"
      }
    ];
  }

  async performSwap(tokenPair, swapAmount, context) {
    this.logger.info(`Performing swap ${swapAmount} ${tokenPair.tokenInName} to ${tokenPair.tokenOutName}`);
    
    const tokenInDecimal = CONFIG.TOKEN_DECIMALS;
    const amountIn = ethers.parseUnits(swapAmount.toString(), tokenInDecimal);
    const amountOutMinimum = 0;
    const fee = 500;
    const recipient = await signer.getAddress();
    const sqrtPriceLimitX96 = 0n; // 0 = no limit
    const deadline = Math.floor(Date.now() / 1000) + 600;

    const erc20AbiPath = path.resolve('ERC20_abi.json');
    const erc20Abi = JSON.parse(fs.readFileSync(erc20AbiPath, 'utf8'));
    const tokenInContract = new ethers.Contract(tokenPair.tokenInAddress, erc20Abi, signer);
    let allowance = await tokenInContract.allowance(recipient, this.getSwapContract());
    
    if (allowance < amountIn) {
      this.logger.info(`Allowance is not enough, approving ${tokenPair.tokenInName}...`);
      const approveTx = await tokenInContract.approve(this.getSwapContract(), amountIn);
      await approveTx.wait();
      this.logger.success(`Approve ${tokenPair.tokenInName} to swap contract success`);
      allowance = await tokenInContract.allowance(recipient, this.getSwapContract());
      this.logger.info(`New allowance: ${allowance.toString()}`);
      if (allowance < amountIn) {
        throw new Error('Approve failed, allowance is still not enough');
      }
    }

    const params = {
      tokenIn: tokenPair.tokenInAddress,
      tokenOut: tokenPair.tokenOutAddress,
      fee,
      recipient,
      deadline,
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96
    };

    const contract = new ethers.Contract(this.getSwapContract(), this.getSwapAbi(), signer);
    let tx, receipt;
    try {
      tx = await contract.exactInputSingle(params, { value: 0 });
      receipt = await tx.wait();
      if (receipt.status !== 1) {
        this.logger.failure('Swap failed, transaction reverted on blockchain');
        throw new Error('Swap revert, status receipt is not 1');
      }
      this.logger.success(`Swap ${swapAmount} ${tokenPair.tokenInName} to ${tokenPair.tokenOutName} success! txHash: ${tx.hash}`);
      return {
        swapAmount: swapAmount.toString(),
        tokenIn: tokenPair.tokenInName,
        tokenOut: tokenPair.tokenOutName,
        txHash: tx.hash,
        receipt
      };
    } catch (error) {
      this.logger.failure(`Swap ${swapAmount} ${tokenPair.tokenInName} to ${tokenPair.tokenOutName} failed: ${error.message}`);
      throw error;
    }
  }

  async performAddLiquidity(tokenPair, amount0, amount1, context) {
    this.logger.info(`Adding liquidity: ${amount0} ${tokenPair.token0Name} + ${amount1} ${tokenPair.token1Name}`);
    
    const token0Decimal = CONFIG.TOKEN_DECIMALS;
    const token1Decimal = CONFIG.TOKEN_DECIMALS;
    const amount0Desired = ethers.parseUnits(amount0.toString(), token0Decimal);
    const amount1Desired = ethers.parseUnits(amount1.toString(), token1Decimal);
    const amount0Min = 0;
    const amount1Min = 0;
    const fee = 100;
    const tickLower = -56040; 
    const tickUpper = 55454; 
    const recipient = await signer.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 600; 

    const erc20AbiPath = path.resolve('ERC20_abi.json');
    const erc20Abi = JSON.parse(fs.readFileSync(erc20AbiPath, 'utf8'));
    
    const token0Contract = new ethers.Contract(tokenPair.token0Address, erc20Abi, signer);
    let allowance0 = await token0Contract.allowance(recipient, this.getLiquidityContract());
    
    if (allowance0 < amount0Desired) {
      this.logger.info(`Approving ${tokenPair.token0Name} for liquidity contract...`);
      const approve0Tx = await token0Contract.approve(this.getLiquidityContract(), amount0Desired);
      await approve0Tx.wait();
      this.logger.info(`Approved ${tokenPair.token0Name} successfully`);
    }

    const token1Contract = new ethers.Contract(tokenPair.token1Address, erc20Abi, signer);
    let allowance1 = await token1Contract.allowance(recipient, this.getLiquidityContract());
    
    if (allowance1 < amount1Desired) {
      this.logger.info(`Approving ${tokenPair.token1Name} for liquidity contract...`);
      const approve1Tx = await token1Contract.approve(this.getLiquidityContract(), amount1Desired);
      await approve1Tx.wait();
      this.logger.info(`Approved ${tokenPair.token1Name} successfully`);
    }

    const params = {
      token0: tokenPair.token0Address,
      token1: tokenPair.token1Address,
      fee,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      recipient,
      deadline
    };

    const contract = new ethers.Contract(this.getLiquidityContract(), this.getLiquidityAbi(), signer);
    let tx, receipt;
    
    try {
      tx = await contract.mint(params, { value: 0 });
      this.logger.info(`Liquidity transaction sent: ${tx.hash}, waiting for confirmation...`);
      
      receipt = await tx.wait();
      
      if (receipt.status !== 1) {
        this.logger.error('Add liquidity failed, transaction reverted on blockchain');
        throw new Error('Add liquidity revert, status receipt is not 1');
      }
      
      let tokenId, liquidity, actualAmount0, actualAmount1;
      
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'IncreaseLiquidity') {
            tokenId = parsedLog.args.tokenId;
            liquidity = parsedLog.args.liquidity;
            actualAmount0 = parsedLog.args.amount0;
            actualAmount1 = parsedLog.args.amount1;
            break;
          }
        } catch (e) {
        }
      }
      
      this.logger.info(`✅ Add liquidity success! Token ID: ${tokenId}, Liquidity: ${liquidity}`);
      this.logger.info(`Amount0: ${ethers.formatUnits(actualAmount0 || amount0Desired, token0Decimal)} ${tokenPair.token0Name}`);
      this.logger.info(`Amount1: ${ethers.formatUnits(actualAmount1 || amount1Desired, token1Decimal)} ${tokenPair.token1Name}`);
      
      return {
        tokenId: tokenId?.toString() || 'unknown',
        liquidity: liquidity?.toString() || 'unknown',
        token0: tokenPair.token0Name,
        token1: tokenPair.token1Name,
        amount0: ethers.formatUnits(actualAmount0 || amount0Desired, token0Decimal),
        amount1: ethers.formatUnits(actualAmount1 || amount1Desired, token1Decimal),
        txHash: tx.hash,
        receipt
      };
    } catch (error) {
      this.logger.error(`Add liquidity failed: ${error.message}`);
      throw error;
    }
  }
} 