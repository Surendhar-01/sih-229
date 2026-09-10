import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateObligationDto {
  @IsUUID() handover_id: string;
  @IsUUID() payee_id: string;
  @IsIn(['USER_PAYOUT', 'COLLECTOR_EARNING', 'RECYCLER_RECEIVABLE', 'AGGREGATOR_SETTLEMENT']) obligation_type: string;
  @IsString() @IsNotEmpty() idempotency_key: string;
  @IsOptional() @IsString() due_at?: string;
}

export class InitiatePaymentDto {
  @IsNumber() @Min(0.01) amount: number;
  @IsIn(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER_DIGITAL']) payment_method: string;
  @IsString() @IsNotEmpty() idempotency_key: string;
  @IsOptional() @IsString() provider_name?: string;
  @IsOptional() @IsString() provider_transaction_reference?: string;
  @IsOptional() @IsString() cash_reference?: string;
  @IsOptional() @IsString() proof_storage_path?: string;
}

export class TransitionPaymentDto {
  @IsString() @IsNotEmpty() idempotency_key: string;
  @IsOptional() @IsString() provider_transaction_reference?: string;
  @IsOptional() @IsString() failure_reason?: string;
}

export class CreateAdjustmentDto {
  @IsUUID() calculation_id: string;
  @IsNumber() amount: number;
  @IsString() @IsNotEmpty() reason: string;
  @IsString() @IsNotEmpty() idempotency_key: string;
  @IsOptional() @IsString() evidence_path?: string;
}

export class ReconcileDto {
  @IsOptional() @IsString() notes?: string;
  @IsString() @IsNotEmpty() idempotency_key: string;
}

export class CreateDisputeDto {
  @IsUUID() payment_obligation_id: string;
  @IsOptional() @IsUUID() transaction_id?: string;
  @IsIn(['WRONG_AMOUNT', 'PAYMENT_NOT_RECEIVED', 'DUPLICATE_PAYMENT', 'CASH_DISPUTE', 'DIGITAL_PAYMENT_ISSUE', 'OTHER']) reason: string;
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() @Min(0.01) disputed_amount: number;
  @IsOptional() @IsString() evidence_path?: string;
}
