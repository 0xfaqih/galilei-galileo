import { BaseDex } from './baseDex.js';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { signer } from '../../config/index.js';
import { CONFIG } from '../../config/index.js';

export class JaineDex extends BaseDex {
  constructor() {
    super('Jaine');
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
      },
      {
        "inputs": [
          {
            "components": [
              { "internalType": "bytes", "name": "path", "type": "bytes" },
              { "internalType": "address", "name": "recipient", "type": "address" },
              { "internalType": "uint256", "name": "deadline", "type": "uint256" },
              { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
              { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" }
            ],
            "internalType": "struct ISwapRouter.ExactInputParams",
            "name": "params",
            "type": "tuple"
          }
        ],
        "name": "exactInput",
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
      },
      {
        "inputs": [
          { "internalType": "address", "name": "tokenA", "type": "address" },
          { "internalType": "address", "name": "tokenB", "type": "address" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" }
        ],
        "name": "createAndInitializePoolIfNecessary",
        "outputs": [
          { "internalType": "address", "name": "pool", "type": "address" }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "factory",
        "outputs": [
          { "internalType": "address", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint128",
            "name": "liquidity",
            "type": "uint128"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "name": "IncreaseLiquidity",
        "type": "event"
      }
    ];
  }

  async performSwap(tokenPair, swapAmount, context) {
    this.logger.info(`Performing JaineDEX swap ${swapAmount} ${tokenPair.tokenInName} to ${tokenPair.tokenOutName}`);
    
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
      this.logger.success(`Approve ${tokenPair.tokenInName} to JaineDEX swap contract success`);
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
        this.logger.failure('JaineDEX swap failed, transaction reverted on blockchain');
        throw new Error('JaineDEX swap revert, status receipt is not 1');
      }
      this.logger.success(`JaineDEX swap ${swapAmount} ${tokenPair.tokenInName} to ${tokenPair.tokenOutName} success! txHash: ${tx.hash}`);
      return {
        swapAmount: swapAmount.toString(),
        tokenIn: tokenPair.tokenInName,
        tokenOut: tokenPair.tokenOutName,
        txHash: tx.hash,
        receipt
      };
    } catch (error) {
      this.logger.failure(`JaineDEX swap ${swapAmount} ${tokenPair.tokenInName} to ${tokenPair.tokenOutName} failed: ${error.message}`);
      throw error;
    }
  }

  async performAddLiquidity(tokenPair, amount0, amount1, context) {
    this.logger.info(`Adding JaineDEX liquidity: ${amount0} ${tokenPair.token0Name} + ${amount1} ${tokenPair.token1Name}`);
    
    const token0Decimal = CONFIG.TOKEN_DECIMALS;
    const token1Decimal = CONFIG.TOKEN_DECIMALS;
    const amount0Desired = ethers.parseUnits(amount0.toString(), token0Decimal);
    const amount1Desired = ethers.parseUnits(amount1.toString(), token1Decimal);
    const amount0Min = 0;
    const amount1Min = 0;
    const fee = 100; 
    const tickLower = -887272; 
    const tickUpper = 887272; 
    const recipient = await signer.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 600;

    let token0Address, token1Address, token0Name, token1Name, amount0Final, amount1Final;
    if (tokenPair.token0Address.toLowerCase() < tokenPair.token1Address.toLowerCase()) {
      token0Address = tokenPair.token0Address;
      token1Address = tokenPair.token1Address;
      token0Name = tokenPair.token0Name;
      token1Name = tokenPair.token1Name;
      amount0Final = amount0Desired;
      amount1Final = amount1Desired;
    } else {
      token0Address = tokenPair.token1Address;
      token1Address = tokenPair.token0Address;
      token0Name = tokenPair.token1Name;
      token1Name = tokenPair.token0Name;
      amount0Final = amount1Desired;
      amount1Final = amount0Desired;
    }

    this.logger.info(`Sorted tokens: token0=${token0Address} (${token0Name}), token1=${token1Address} (${token1Name})`);
    this.logger.info(`Liquidity parameters: fee=${fee}, tickLower=${tickLower}, tickUpper=${tickUpper}`);
    this.logger.info(`Amounts: amount0Desired=${amount0Final.toString()}, amount1Desired=${amount1Final.toString()}`);

    const erc20AbiPath = path.resolve('ERC20_abi.json');
    const erc20Abi = JSON.parse(fs.readFileSync(erc20AbiPath, 'utf8'));
    
    const token0Contract = new ethers.Contract(token0Address, erc20Abi, signer);
    let allowance0 = await token0Contract.allowance(recipient, this.getLiquidityContract());
    
    if (allowance0 < amount0Final) {
      this.logger.info(`Approving ${token0Name} for JaineDEX liquidity contract...`);
      const approve0Tx = await token0Contract.approve(this.getLiquidityContract(), amount0Final);
      await approve0Tx.wait();
      this.logger.info(`Approved ${token0Name} successfully`);
      allowance0 = await token0Contract.allowance(recipient, this.getLiquidityContract());
      this.logger.info(`New allowance for ${token0Name}: ${allowance0.toString()}`);
    }

    const token1Contract = new ethers.Contract(token1Address, erc20Abi, signer);
    let allowance1 = await token1Contract.allowance(recipient, this.getLiquidityContract());
    
    if (allowance1 < amount1Final) {
      this.logger.info(`Approving ${token1Name} for JaineDEX liquidity contract...`);
      const approve1Tx = await token1Contract.approve(this.getLiquidityContract(), amount1Final);
      await approve1Tx.wait();
      this.logger.info(`Approved ${token1Name} successfully`);
      allowance1 = await token1Contract.allowance(recipient, this.getLiquidityContract());
      this.logger.info(`New allowance for ${token1Name}: ${allowance1.toString()}`);
    }

    if (allowance0 < amount0Final) {
      throw new Error(`Insufficient allowance for ${token0Name}: ${allowance0} < ${amount0Final}`);
    }
    if (allowance1 < amount1Final) {
      throw new Error(`Insufficient allowance for ${token1Name}: ${allowance1} < ${amount1Final}`);
    }

    const params = {
      token0: token0Address,
      token1: token1Address,
      fee,
      tickLower,
      tickUpper,
      amount0Desired: amount0Final,
      amount1Desired: amount1Final,
      amount0Min,
      amount1Min,
      recipient,
      deadline
    };

    // this.logger.info(`Mint params: ${JSON.stringify({
    //   token0: params.token0,
    //   token1: params.token1,
    //   fee: params.fee,
    //   tickLower: params.tickLower,
    //   tickUpper: params.tickUpper,
    //   amount0Desired: params.amount0Desired.toString(),
    //   amount1Desired: params.amount1Desired.toString(),
    //   amount0Min: params.amount0Min.toString(),
    //   amount1Min: params.amount1Min.toString(),
    //   recipient: params.recipient,
    //   deadline: params.deadline
    // }, null, 2)}`);

    const contract = new ethers.Contract(this.getLiquidityContract(), this.getLiquidityAbi(), signer);
    let tx, receipt;
    
    try {
      try {
        const factoryAbi = [
          {
            "inputs": [
              { "internalType": "address", "name": "tokenA", "type": "address" },
              { "internalType": "address", "name": "tokenB", "type": "address" },
              { "internalType": "uint24", "name": "fee", "type": "uint24" }
            ],
            "name": "getPool",
            "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
          }
        ];
        
        const factoryAddress = await contract.factory();
        const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, signer);
        const poolAddress = await factoryContract.getPool(token0Address, token1Address, fee);
        
        if (poolAddress === '0x0000000000000000000000000000000000000000') {
          this.logger.info(`Pool doesn't exist, creating pool for ${token0Name}/${token1Name} with fee ${fee}`);
          const createPoolTx = await contract.createAndInitializePoolIfNecessary(
            token0Address,
            token1Address,
            fee,
            ethers.parseUnits('1', 18) // sqrt price x96
          );
          await createPoolTx.wait();
          this.logger.info(`Pool created successfully`);
        } else {
          this.logger.info(`Pool exists at: ${poolAddress}`);
        }
      } catch (poolError) {
        this.logger.warn(`Could not check/create pool: ${poolError.message}`);
      }

      const encodedData = contract.interface.encodeFunctionData('mint', [params]);
      // this.logger.info(`Encoded mint data: ${encodedData}`);
      
      tx = await contract.mint(params, { value: 0 });
      this.logger.info(`JaineDEX liquidity transaction sent: ${tx.hash}, waiting for confirmation...`);
      
      receipt = await tx.wait();
      
      if (receipt.status !== 1) {
        this.logger.error('JaineDEX add liquidity failed, transaction reverted on blockchain');
        throw new Error('JaineDEX add liquidity revert, status receipt is not 1');
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
      
      this.logger.info(`✅ JaineDEX add liquidity success! Token ID: ${tokenId}, Liquidity: ${liquidity}`);
      this.logger.info(`Amount0: ${ethers.formatUnits(actualAmount0 || amount0Final, token0Decimal)} ${token0Name}`);
      this.logger.info(`Amount1: ${ethers.formatUnits(actualAmount1 || amount1Final, token1Decimal)} ${token1Name}`);
      
      return {
        tokenId: tokenId?.toString() || 'unknown',
        liquidity: liquidity?.toString() || 'unknown',
        token0: token0Name,
        token1: token1Name,
        amount0: ethers.formatUnits(actualAmount0 || amount0Final, token0Decimal),
        amount1: ethers.formatUnits(actualAmount1 || amount1Final, token1Decimal),
        txHash: tx.hash,
        receipt
      };
    } catch (error) {
      this.logger.error(`JaineDEX add liquidity failed: ${error.message}`);
      this.logger.error(`Error name: ${error.name}, Error code: ${error.code}`);
      throw error;
    }
  }
}
