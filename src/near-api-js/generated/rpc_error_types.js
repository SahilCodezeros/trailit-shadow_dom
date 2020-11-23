import { TypedError } from '../utils/errors';
export class ServerError extends TypedError {
}
export class TxExecutionError extends ServerError {
}
export class ActionError extends TxExecutionError {
}
export class FunctionCallError extends ActionError {
}
export class HostError extends FunctionCallError {
}
export class BadUTF16 extends HostError {
}
export class BadUTF8 extends HostError {
}
export class BalanceExceeded extends HostError {
}
export class CannotAppendActionToJointPromise extends HostError {
}
export class CannotReturnJointPromise extends HostError {
}
export class CompilationError extends FunctionCallError {
}
export class CodeDoesNotExist extends CompilationError {
}
export class ContractSizeExceeded extends HostError {
}
export class PrepareError extends CompilationError {
}
export class Deserialization extends PrepareError {
}
export class EmptyMethodName extends HostError {
}
export class GasExceeded extends HostError {
}
export class GasInstrumentation extends PrepareError {
}
export class GasLimitExceeded extends HostError {
}
export class GuestPanic extends HostError {
}
export class Instantiate extends PrepareError {
}
export class IntegerOverflow extends HostError {
}
export class InternalMemoryDeclared extends PrepareError {
}
export class InvalidAccountId extends HostError {
}
export class InvalidIteratorIndex extends HostError {
}
export class InvalidMethodName extends HostError {
}
export class InvalidPromiseIndex extends HostError {
}
export class InvalidPromiseResultIndex extends HostError {
}
export class InvalidPublicKey extends HostError {
}
export class InvalidReceiptIndex extends HostError {
}
export class InvalidRegisterId extends HostError {
}
export class IteratorWasInvalidated extends HostError {
}
export class KeyLengthExceeded extends HostError {
}
export class LinkError extends FunctionCallError {
}
export class Memory extends PrepareError {
}
export class MemoryAccessViolation extends HostError {
}
export class MethodResolveError extends FunctionCallError {
}
export class MethodEmptyName extends MethodResolveError {
}
export class MethodInvalidSignature extends MethodResolveError {
}
export class MethodNotFound extends MethodResolveError {
}
export class MethodUTF8Error extends MethodResolveError {
}
export class NumberInputDataDependenciesExceeded extends HostError {
}
export class NumberOfLogsExceeded extends HostError {
}
export class NumberPromisesExceeded extends HostError {
}
export class ProhibitedInView extends HostError {
}
export class ReturnedValueLengthExceeded extends HostError {
}
export class Serialization extends PrepareError {
}
export class StackHeightInstrumentation extends PrepareError {
}
export class TotalLogLengthExceeded extends HostError {
}
export class ValueLengthExceeded extends HostError {
}
export class WasmTrap extends FunctionCallError {
}
export class WasmerCompileError extends CompilationError {
}
export class InvalidTxError extends TxExecutionError {
}
export class InvalidAccessKeyError extends InvalidTxError {
}
export class AccessKeyNotFound extends InvalidAccessKeyError {
}
export class AccountAlreadyExists extends ActionError {
}
export class AccountDoesNotExist extends ActionError {
}
export class ActorNoPermission extends ActionError {
}
export class AddKeyAlreadyExists extends ActionError {
}
export class BalanceMismatchError extends TypedError {
}
export class CostOverflow extends InvalidTxError {
}
export class CreateAccountNotAllowed extends ActionError {
}
export class DeleteAccountHasRent extends TypedError {
}
export class DeleteAccountStaking extends ActionError {
}
export class DeleteKeyDoesNotExist extends ActionError {
}
export class DepositWithFunctionCall extends InvalidAccessKeyError {
}
export class Expired extends InvalidTxError {
}
export class InvalidChain extends InvalidTxError {
}
export class InvalidNonce extends InvalidTxError {
}
export class InvalidReceiverId extends InvalidTxError {
}
export class InvalidSignature extends InvalidTxError {
}
export class InvalidSignerId extends InvalidTxError {
}
export class MethodNameMismatch extends InvalidAccessKeyError {
}
export class NotEnoughAllowance extends InvalidAccessKeyError {
}
export class NotEnoughBalance extends InvalidTxError {
}
export class ReceiverMismatch extends InvalidAccessKeyError {
}
export class RentUnpaid extends TypedError {
}
export class RequiresFullAccess extends InvalidAccessKeyError {
}
export class SignerDoesNotExist extends InvalidTxError {
}
export class TriesToStake extends ActionError {
}
export class TriesToUnstake extends ActionError {
}
export class Closed extends ServerError {
}
export class Timeout extends ServerError {
}
export class UnsuitableStakingKey extends ActionError {
}
export class LackBalanceForState extends ActionError {
}
export class DeleteAccountHasEnoughBalance extends ActionError {
}
export class Deprecated extends HostError {
}
