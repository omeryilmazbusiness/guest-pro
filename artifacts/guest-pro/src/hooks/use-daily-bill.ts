import { useQuery } from "@tanstack/react-query";
import { fetchDailyBill, fetchFolioDays, todayIsoDate, type DailyBill } from "@/lib/folio";

export function useDailyBill(date: string) {
  return useQuery({
    queryKey: ["folio-daily", date],
    queryFn: () => fetchDailyBill(date),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useFolioDays(limit = 14) {
  return useQuery({
    queryKey: ["folio-days", limit],
    queryFn: () => fetchFolioDays(limit),
    staleTime: 60_000,
  });
}

export function useTodayBill() {
  const today = todayIsoDate();
  return useDailyBill(today);
}

export function billHasCharges(bill: DailyBill | undefined): boolean {
  return !!bill && parseFloat(bill.subtotal) > 0 && bill.itemCount > 0;
}
