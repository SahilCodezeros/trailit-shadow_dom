import depd from 'depd';
import { Provider } from './provider';
import { fetchJson } from '../utils/web';
import { TypedError, ErrorContext } from '../utils/errors';
import { base_encode } from '../utils/serialize';
import { parseRpcError } from '../utils/rpc_errors';

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

export { TypedError, ErrorContext };
/// Keep ids unique across all connections.
let _nextId = 123;
export class JsonRpcProvider extends Provider {
    constructor(url) {
        super();
        this.connection = { url };
    }
    /**
     * Get the current network (ex. test, beta, etc…)
     * @returns {Promise<Network>}
     */
    getNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                name: 'test',
                chainId: 'test'
            };
        });
    }
    /**
     * Gets the RPC's status
     * See [docs for more info](https://docs.nearprotocol.com/docs/interaction/rpc#status)
     * @returns {Promise<NodeStatusResult>}
     */
    status() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendJsonRpc('status', []);
        });
    }
    /**
     * Sends a signed transaction to the RPC
     * See [docs for more info](https://docs.nearprotocol.com/docs/interaction/rpc#send-transaction-wait-until-done)
     * @param signedTransaction The signed transaction being sent
     * @returns {Promise<FinalExecutionOutcome>}
     */
    sendTransaction(signedTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const bytes = signedTransaction.encode();
            return this.sendJsonRpc('broadcast_tx_commit', [Buffer.from(bytes).toString('base64')]);
        });
    }
    /**
     * Gets a transaction's status from the RPC
     * See [docs for more info](https://docs.nearprotocol.com/docs/interaction/rpc#status)
     * @param txHash The hash of the transaction
     * @param accountId The NEAR account that signed the transaction
     * @returns {Promise<FinalExecutionOutcome>}
     */
    txStatus(txHash, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendJsonRpc('tx', [base_encode(txHash), accountId]);
        });
    }
    /**
     * Query the RPC as [shown in the docs](https://docs.nearprotocol.com/docs/interaction/rpc#query)
     * @param path Path parameter for the RPC (ex. "contract/my_token")
     * @param data Data parameter (ex. "", "AQ4", or whatever is needed)
     */
    query(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendJsonRpc('query', [path, data]);
            if (result && result.error) {
                throw new Error(`Querying ${path} failed: ${result.error}.\n${JSON.stringify(result, null, 2)}`);
            }
            return result;
        });
    }
    /**
     * Query for block info from the RPC
     * See [docs for more info](https://docs.nearprotocol.com/docs/interaction/rpc#block)
     */
    block(blockQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            const { finality } = blockQuery;
            let { blockId } = blockQuery;
            if (typeof blockQuery !== 'object') {
                const deprecate = depd('JsonRpcProvider.block(blockId)');
                deprecate('use `block({ blockId })` or `block({ finality })` instead');
                blockId = blockQuery;
            }
            return this.sendJsonRpc('block', { block_id: blockId, finality });
        });
    }
    /**
     * Queries for details of a specific chunk appending details of receipts and transactions to the same chunk data provided by a block
     * See [docs for more info](https://docs.nearprotocol.com/docs/interaction/rpc#chunk)
     * @param chunkId Hash of a chunk ID or shard ID
     * @returns {Promise<ChunkResult>}
     */
    chunk(chunkId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendJsonRpc('chunk', [chunkId]);
        });
    }
    /**
     * Query validators of the epoch defined by given block id.
     * See [docs for more info](https://docs.nearprotocol.com/docs/interaction/rpc#validators)
     * @param blockId Block hash or height, or null for latest.
     */
    validators(blockId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendJsonRpc('validators', [blockId]);
        });
    }
    /**
     * Gets EXPERIMENTAL_genesis_config from RPC
     * @returns {Promise<GenesisConfig>}
     */
    experimental_genesisConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendJsonRpc('EXPERIMENTAL_genesis_config', []);
        });
    }
    /**
     * Gets light_client_proof from RPC (https://github.com/nearprotocol/NEPs/blob/master/specs/ChainSpec/LightClient.md#light-client-proof)
     * @returns {Promise<LightClientProof>}
     * @deprecated Use `lightClientProof` instead
     */
    experimental_lightClientProof(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const deprecate = depd('JsonRpcProvider.experimental_lightClientProof(request)');
            deprecate('use `lightClientProof` instead');
            return yield this.lightClientProof(request);
        });
    }
    /**
     * Gets light_client_proof from RPC (https://github.com/nearprotocol/NEPs/blob/master/specs/ChainSpec/LightClient.md#light-client-proof)
     * @returns {Promise<LightClientProof>}
     */
    lightClientProof(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendJsonRpc('EXPERIMENTAL_light_client_proof', request);
        });
    }
    /**
     * Directly call the RPC specifying the method and params
     * @param method RPC method
     * @param params Parameters to the method
     */
    sendJsonRpc(method, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method,
                params,
                id: (_nextId++),
                jsonrpc: '2.0'
            };
            const response = yield fetchJson(this.connection, JSON.stringify(request));
            if (response.error) {
                if (typeof response.error.data === 'object') {
                    if (typeof response.error.data.error_message === 'string' && typeof response.error.data.error_type === 'string') {
                        // if error data has error_message and error_type properties, we consider that node returned an error in the old format
                        throw new TypedError(response.error.data.error_message, response.error.data.error_type);
                    }
                    else {
                        throw parseRpcError(response.error.data);
                    }
                }
                else {
                    const errorMessage = `[${response.error.code}] ${response.error.message}: ${response.error.data}`;
                    // NOTE: All this hackery is happening because structured errors not implemented
                    // TODO: Fix when https://github.com/nearprotocol/nearcore/issues/1839 gets resolved
                    if (response.error.data === 'Timeout' || errorMessage.includes('Timeout error')) {
                        throw new TypedError('send_tx_commit has timed out.', 'TimeoutError');
                    }
                    else {
                        throw new TypedError(errorMessage);
                    }
                }
            }
            return response.result;
        });
    }
}
