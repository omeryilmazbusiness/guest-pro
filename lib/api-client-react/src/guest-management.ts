/**
 * Guest management API — not yet in OpenAPI spec.
 * Kept outside generated/ so `pnpm codegen` does not remove these hooks.
 */
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";
import type { CreateGuestResponse, ErrorResponse, Guest } from "./generated/api.schemas";

export interface UpdateGuestRequest {
  firstName?: string;
  lastName?: string;
  roomNumber?: string;
  countryCode?: string;
  checkInDate?: string;
  checkOutDate?: string;
  wifiNetworkId?: number | null;
}

export type UpdateGuestResponse = Guest;

export interface DeleteGuestResponse {
  success: boolean;
}

export type RenewGuestKeyResponse = CreateGuestResponse;

export const getUpdateGuestUrl = (id: number) => `/api/guests/${id}`;

export const updateGuest = async (
  id: number,
  data: UpdateGuestRequest,
  options?: RequestInit,
): Promise<UpdateGuestResponse> => {
  return customFetch<UpdateGuestResponse>(getUpdateGuestUrl(id), {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(data),
  });
};

export const useUpdateGuest = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    UpdateGuestResponse,
    TError,
    { id: number; data: UpdateGuestRequest },
    TContext
  >;
}) => {
  const mutationKey = ["updateGuest"];
  const mutationOptions = options?.mutation ?? {};
  return useMutation<
    UpdateGuestResponse,
    TError,
    { id: number; data: UpdateGuestRequest },
    TContext
  >({
    mutationKey,
    mutationFn: ({ id, data }) => updateGuest(id, data),
    ...mutationOptions,
  });
};

export const getDeleteGuestUrl = (id: number) => `/api/guests/${id}`;

export const deleteGuest = async (
  id: number,
  options?: RequestInit,
): Promise<DeleteGuestResponse> => {
  return customFetch<DeleteGuestResponse>(getDeleteGuestUrl(id), {
    ...options,
    method: "DELETE",
  });
};

export const useDeleteGuest = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<DeleteGuestResponse, TError, { id: number }, TContext>;
}) => {
  const mutationKey = ["deleteGuest"];
  const mutationOptions = options?.mutation ?? {};
  return useMutation<DeleteGuestResponse, TError, { id: number }, TContext>({
    mutationKey,
    mutationFn: ({ id }) => deleteGuest(id),
    ...mutationOptions,
  });
};

export const getRenewGuestKeyUrl = (id: number) => `/api/guests/${id}/renew-key`;

export const renewGuestKey = async (
  id: number,
  options?: RequestInit,
): Promise<RenewGuestKeyResponse> => {
  return customFetch<RenewGuestKeyResponse>(getRenewGuestKeyUrl(id), {
    ...options,
    method: "POST",
  });
};

export const useRenewGuestKey = <
  TError = ErrorType<ErrorResponse>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<RenewGuestKeyResponse, TError, { id: number }, TContext>;
}) => {
  const mutationKey = ["renewGuestKey"];
  const mutationOptions = options?.mutation ?? {};
  return useMutation<RenewGuestKeyResponse, TError, { id: number }, TContext>({
    mutationKey,
    mutationFn: ({ id }) => renewGuestKey(id),
    ...mutationOptions,
  });
};
