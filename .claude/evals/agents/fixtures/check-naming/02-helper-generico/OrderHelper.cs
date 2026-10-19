namespace Orders.Application;

public static class OrderHelper
{
    public static decimal CalculateDiscount(decimal total) => total >= 100m ? total * 0.1m : 0m;

    public static string FormatProtocol(Guid orderId) => $"ORD-{orderId.ToString()[..8].ToUpperInvariant()}";

    public static bool IsWeekend(DateTime date) => date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
}
